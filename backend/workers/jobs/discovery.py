"""
Discovery Worker Jobs — ARQ background jobs for the discovery pipeline.

Jobs:
  discover_businesses      — Run a single source/query discovery
  validate_business        — Validate a raw business (scoring + website check)
  enrich_business          — Enrich a validated business with website intelligence
  bulk_discovery_job       — Orchestrate a bulk discovery across many queries
"""

import uuid
from datetime import UTC, datetime

import structlog
from sqlalchemy import select

from core.database import AsyncSessionFactory
from domain.discovery.models import DiscoveryBulkJob, DiscoveryRun, RawBusiness
from domain.discovery.sources import get_source
from services.discovery.deduplication_service import DeduplicationService
from services.discovery.discovery_orchestrator import DiscoveryOrchestrator
from services.enrichment.service import EnrichmentService
from services.validation.service import ValidationService

logger = structlog.get_logger()


async def discover_businesses(
    ctx: dict,
    run_id: str,
    limit: int,
    bulk_job_id: str | None = None,
) -> None:
    """
    Execute a single discovery run for a specific source + query.
    Integrates deduplication before persisting.
    """
    async with AsyncSessionFactory() as session:
        result = await session.execute(
            select(DiscoveryRun).where(DiscoveryRun.id == uuid.UUID(run_id))
        )
        run = result.scalar_one_or_none()
        if not run:
            return

        run.status = "RUNNING"
        run.started_at = datetime.now(UTC)
        await session.commit()

        # Get the source instance
        source_instance = get_source(run.source)
        if not source_instance:
            run.status = "FAILED"
            run.error_message = f"Unknown source: {run.source}"
            run.completed_at = datetime.now(UTC)
            await session.commit()
            return

        discovered_count = 0
        duplicate_count = 0
        redis = ctx.get("redis")

        try:
            logger.info(
                "bulk_discovery_started",
                source=run.source,
                industry=run.query,
                location=run.location,
            )
            raw_businesses_dicts = await source_instance.discover(
                industry=run.query or "",
                location=run.location or "",
                limit=limit,
            )

            for b_dict in raw_businesses_dicts:
                b_dict["source"] = run.source

                # Deduplication check
                is_dup = await DeduplicationService.is_duplicate(session, b_dict)
                if is_dup:
                    duplicate_count += 1
                    # Optionally merge into existing record
                    existing = await DeduplicationService.find_existing(session, b_dict)
                    if existing:
                        DeduplicationService.merge_duplicate(existing, b_dict)
                    continue

                # Persist new business
                business = RawBusiness(
                    source=run.source,
                    run_id=run.id,
                    business_name=b_dict.get("business_name", "")[:255],
                    website=b_dict.get("website"),
                    phone=b_dict.get("phone"),
                    email=b_dict.get("email"),
                    address=b_dict.get("address"),
                    city=b_dict.get("city"),
                    state=b_dict.get("state"),
                    country=b_dict.get("country"),
                    industry=b_dict.get("industry"),
                    rating=b_dict.get("rating"),
                    google_rating=b_dict.get("google_rating"),
                    review_count=b_dict.get("review_count"),
                    google_maps_url=b_dict.get("google_maps_url"),
                    opening_hours=b_dict.get("opening_hours") or {},
                    raw_payload=b_dict.get("raw_payload") or {},
                    validation_status="PENDING",
                    is_duplicate=False,
                )
                session.add(business)
                await session.flush()

                # Enqueue validation
                if redis:
                    await redis.enqueue_job("validate_business", str(business.id))

                discovered_count += 1

            run.businesses_discovered = discovered_count
            run.status = "COMPLETED"

            logger.info(
                "Discovery run complete",
                run_id=run_id,
                source=run.source,
                businesses_found=discovered_count + duplicate_count,
                businesses_saved=discovered_count,
                duplicates_removed=duplicate_count,
            )

        except Exception as e:
            run.status = "FAILED"
            run.error_message = str(e)[:500]
            logger.error("Discovery run failed", run_id=run_id, error=str(e))

        run.completed_at = datetime.now(UTC)
        await session.commit()

        # Update bulk job progress
        if bulk_job_id:
            async with AsyncSessionFactory() as bulk_session:
                failed = 1 if run.status == "FAILED" else 0
                completed = 1 if run.status == "COMPLETED" else 0
                await DiscoveryOrchestrator.update_bulk_progress(
                    bulk_session,
                    bulk_job_id,
                    completed_delta=completed,
                    failed_delta=failed,
                    discovered_delta=discovered_count,
                )


async def validate_business(ctx: dict, business_id: str) -> None:
    """
    Validate a raw business: completeness scoring + website reachability.
    Only enqueues enrichment if completeness_score >= 60 (VALID).
    """
    async with AsyncSessionFactory() as session:
        result = await session.execute(
            select(RawBusiness).where(RawBusiness.id == uuid.UUID(business_id))
        )
        business = result.scalar_one_or_none()
        if not business:
            return

        b_dict = {
            "business_name": business.business_name,
            "website": business.website,
            "email": business.email,
            "phone": business.phone,
            "address": business.address,
            "industry": business.industry,
            "rating": business.rating or business.google_rating,
            "raw_payload": dict(business.raw_payload or {}),
        }

        validated_dict = await ValidationService.validate_business(b_dict)

        business.validation_status = validated_dict.get("validation_status", "INVALID")
        business.completeness_score = validated_dict.get("completeness_score", 0)
        business.raw_payload = dict(validated_dict.get("raw_payload", {}))

        await session.commit()

        # Enrich if VALID
        if business.validation_status == "VALID":
            redis = ctx.get("redis")
            if redis:
                await redis.enqueue_job("enrich_business", business_id)


async def enrich_business(ctx: dict, business_id: str) -> None:
    """
    Enrich a validated business with website intelligence:
    social profiles, email, meta tags, analytics detection.
    """
    async with AsyncSessionFactory() as session:
        result = await session.execute(
            select(RawBusiness).where(RawBusiness.id == uuid.UUID(business_id))
        )
        business = result.scalar_one_or_none()
        if not business:
            return

        b_dict = {
            "website": business.website,
            "email": business.email,
            "raw_payload": dict(business.raw_payload or {}),
        }

        enriched_dict = await EnrichmentService.enrich_business(b_dict)

        # Apply enriched fields back to model
        business.raw_payload = dict(enriched_dict.get("raw_payload", {}))

        if enriched_dict.get("email"):
            business.email = enriched_dict["email"]
        if enriched_dict.get("instagram_url"):
            business.instagram_url = enriched_dict["instagram_url"]
        if enriched_dict.get("facebook_url"):
            business.facebook_url = enriched_dict["facebook_url"]
        if enriched_dict.get("linkedin_url"):
            business.linkedin_url = enriched_dict["linkedin_url"]
        if enriched_dict.get("youtube_url"):
            business.youtube_url = enriched_dict["youtube_url"]
        if enriched_dict.get("meta_title"):
            business.meta_title = enriched_dict["meta_title"]
        if enriched_dict.get("meta_description"):
            business.meta_description = enriched_dict["meta_description"]

        business.enriched_at = datetime.now(UTC)

        from domain.lead.models import Lead

        lead = Lead(
            business_name=business.business_name,
            email=business.email,
            phone=business.phone,
            website=business.website,
            industry=business.industry,
            city=business.city,
            state=business.state,
            country=business.country,
            instagram_url=business.instagram_url,
            facebook_url=business.facebook_url,
            linkedin_url=business.linkedin_url,
            google_maps_url=business.google_maps_url,
            source="Discovery Engine",
            status="NEW",
            is_published=True,
        )
        session.add(lead)

        if business.run_id:
            run_result = await session.execute(
                select(DiscoveryRun).where(DiscoveryRun.id == business.run_id)
            )
            run = run_result.scalar_one_or_none()
            if run:
                run.businesses_created += 1

        await session.commit()
        await session.refresh(lead)

        logger.info(
            "Business enriched and automatically promoted to Lead",
            business_id=business_id,
            lead_id=str(lead.id),
            name=business.business_name,
        )

        # Automatically enqueue downstream workflows
        redis = ctx.get("redis")
        if redis:
            if lead.website:
                await redis.enqueue_job("analyze_website_job", str(lead.id), lead.website)
            await redis.enqueue_job("qualify_lead_job", str(lead.id))


async def bulk_discovery_job(ctx: dict, bulk_job_id: str) -> None:
    """
    Orchestrate a bulk discovery run.
    Reads the DiscoveryBulkJob and fans out individual discovery runs.
    """
    async with AsyncSessionFactory() as session:
        result = await session.execute(
            select(DiscoveryBulkJob).where(DiscoveryBulkJob.id == uuid.UUID(bulk_job_id))
        )
        job = result.scalar_one_or_none()
        if not job:
            logger.error("Bulk job not found", bulk_job_id=bulk_job_id)
            return

        redis = ctx.get("redis")
        if not redis:
            logger.error("No Redis available for bulk discovery job")
            return

        logger.info(
            "Bulk discovery job starting",
            bulk_job_id=bulk_job_id,
            industries=len(job.industries),
            locations=len(job.locations),
            sources=len(job.sources),
            total_queries=job.total_queries,
        )

        try:
            await DiscoveryOrchestrator.distribute_queries(
                redis=redis,
                bulk_job_id=bulk_job_id,
                industries=list(job.industries),
                locations=list(job.locations),
                sources=list(job.sources),
                limit_per_query=job.limit_per_query,
            )
        except Exception as e:
            logger.error("Bulk discovery orchestration failed", error=str(e))
            job.status = "FAILED"
            job.error_message = str(e)[:500]
            await session.commit()
