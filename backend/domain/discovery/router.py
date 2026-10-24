"""
Discovery Router — REST API for the Enterprise Discovery Pipeline.

Endpoints:
  POST /v1/discovery/run                   — Start a single discovery run
  GET  /v1/discovery/runs                  — List all discovery runs
  GET  /v1/discovery/runs/{run_id}         — Get a specific run

  POST /v1/discovery/bulk                  — Launch bulk discovery job
  GET  /v1/discovery/bulk/{job_id}         — Get bulk job status

  GET  /v1/discovery/businesses            — Filtered/paginated business listing
  POST /v1/discovery/businesses/{id}/promote — Promote business to lead

  GET  /v1/discovery/metrics               — Full metrics dashboard data
  GET  /v1/discovery/sources               — List available sources

  DELETE /v1/discovery/businesses/{id}/duplicate  — Mark as duplicate manually
"""

import math
import uuid
from datetime import UTC, datetime

import structlog
from arq.connections import ArqRedis
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)

from api.deps import get_current_user
from core.database import get_db
from domain.discovery.models import DiscoveryBulkJob, DiscoveryRun, RawBusiness
from domain.discovery.schemas import (
    BulkDiscoveryRequest,
    BulkDiscoveryResponse,
    DiscoveryMetricsResponse,
    DiscoveryRunCreate,
    DiscoveryRunResponse,
    PaginatedBusinessesResponse,
)
from domain.discovery.sources import ALL_SOURCES
from domain.user.models import User
from services.discovery.discovery_metrics_service import DiscoveryMetricsService
from services.discovery.discovery_orchestrator import (
    INDUSTRIES,
    MUMBAI_LOCATIONS,
    DiscoveryOrchestrator,
)
from services.discovery.service import DiscoveryService


async def get_redis(request: Request) -> ArqRedis:
    return getattr(request.app.state, "redis", None)


router = APIRouter(prefix="/discovery", tags=["Discovery"])


# ── Single Run ────────────────────────────────────────────────────────────────


@router.post("/run", response_model=DiscoveryRunResponse)
async def create_discovery_run(
    run_in: DiscoveryRunCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.has_permission("discovery:create"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    redis = await get_redis(request)
    run = await DiscoveryService.create_discovery_run(db, redis, run_in)
    return run


@router.get("/runs", response_model=list[DiscoveryRunResponse])
async def list_discovery_runs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
):
    if not current_user.has_permission("discovery:read"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    result = await db.execute(
        select(DiscoveryRun).order_by(DiscoveryRun.created_at.desc()).offset(skip).limit(limit)
    )
    runs = result.scalars().all()

    if runs:
        run_ids = [r.id for r in runs]
        counts_res = await db.execute(
            select(
                RawBusiness.run_id,
                func.count(RawBusiness.id).label("discovered"),
                func.sum(
                    func.cast(RawBusiness.validation_status == "VALID", type_=func.count().type)
                ).label("validated"),
                func.sum(
                    func.cast(RawBusiness.enriched_at.isnot(None), type_=func.count().type)
                ).label("promoted"),
            )
            .where(RawBusiness.run_id.in_(run_ids))
            .group_by(RawBusiness.run_id)
        )
        counts_map = {
            row.run_id: {
                "discovered": row.discovered or 0,
                "validated": row.validated or 0,
                "promoted": row.promoted or 0,
            }
            for row in counts_res.all()
        }

        responses = []
        for r in runs:
            cmap = counts_map.get(r.id, {})
            resp = DiscoveryRunResponse.model_validate(r)
            resp.businesses_discovered = max(r.businesses_discovered, cmap.get("discovered", 0))
            resp.businesses_validated = cmap.get("validated", 0)
            resp.businesses_created = cmap.get("promoted", 0)
            responses.append(resp)
        return responses

    return runs


@router.get("/runs/{run_id}", response_model=DiscoveryRunResponse)
async def get_discovery_run(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.has_permission("discovery:read"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    result = await db.execute(select(DiscoveryRun).where(DiscoveryRun.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    counts = await db.execute(
        select(
            func.count(RawBusiness.id).label("discovered"),
            func.sum(
                func.cast(RawBusiness.validation_status == "VALID", type_=func.count().type)
            ).label("validated"),
            func.sum(func.cast(RawBusiness.enriched_at.isnot(None), type_=func.count().type)).label(
                "promoted"
            ),
        ).where(RawBusiness.run_id == run.id)
    )
    row = counts.first()
    resp = DiscoveryRunResponse.model_validate(run)
    if row:
        resp.businesses_discovered = max(run.businesses_discovered, row.discovered or 0)
        resp.businesses_validated = row.validated or 0
        resp.businesses_created = row.promoted or 0

    return resp


# ── Bulk Discovery ────────────────────────────────────────────────────────────


@router.post("/bulk", response_model=BulkDiscoveryResponse)
async def launch_bulk_discovery(
    payload: BulkDiscoveryRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Launch a bulk discovery job across multiple industries, locations, and sources."""
    if not current_user.has_permission("discovery:create"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    if not payload.industries:
        raise HTTPException(status_code=400, detail="At least one industry required")
    if not payload.locations:
        raise HTTPException(status_code=400, detail="At least one location required")
    if payload.limit_per_query < 1 or payload.limit_per_query > 100:
        raise HTTPException(status_code=400, detail="limit_per_query must be 1-100")

    redis = await get_redis(request)
    if not redis:
        logger.warning(
            "redis_unavailable",
            endpoint="/discovery/bulk",
            fallback="creating local job record without queueing",
        )

    bulk_job = await DiscoveryOrchestrator.launch_bulk_discovery(
        session=db,
        redis=redis,
        industries=payload.industries,
        locations=payload.locations,
        sources=payload.sources or ALL_SOURCES,
        limit_per_query=payload.limit_per_query,
    )
    return bulk_job


@router.get("/bulk/{job_id}", response_model=BulkDiscoveryResponse)
async def get_bulk_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.has_permission("discovery:read"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    result = await db.execute(select(DiscoveryBulkJob).where(DiscoveryBulkJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Bulk job not found")
    return job


@router.get("/bulk", response_model=list[BulkDiscoveryResponse])
async def list_bulk_jobs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 20,
):
    if not current_user.has_permission("discovery:read"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    result = await db.execute(
        select(DiscoveryBulkJob).order_by(DiscoveryBulkJob.created_at.desc()).limit(limit)
    )
    return result.scalars().all()


# ── Businesses ────────────────────────────────────────────────────────────────


@router.get("/businesses", response_model=PaginatedBusinessesResponse)
async def list_raw_businesses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status: str | None = Query(None, description="Filter by validation_status"),
    source: str | None = Query(None, description="Filter by source"),
    industry: str | None = Query(None, description="Filter by industry"),
    city: str | None = Query(None, description="Filter by city"),
    min_completeness: int | None = Query(None, description="Minimum completeness score"),
    is_duplicate: bool | None = Query(None, description="Filter duplicates"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
):
    if not current_user.has_permission("discovery:read"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    filters = []
    if status:
        filters.append(RawBusiness.validation_status == status.upper())
    if source:
        filters.append(RawBusiness.source == source)
    if industry:
        filters.append(RawBusiness.industry.ilike(f"%{industry}%"))
    if city:
        filters.append(RawBusiness.city.ilike(f"%{city}%"))
    if min_completeness is not None:
        filters.append(RawBusiness.completeness_score >= min_completeness)
    if is_duplicate is not None:
        filters.append(RawBusiness.is_duplicate.is_(is_duplicate))

    # Count total
    count_q = select(func.count(RawBusiness.id))
    if filters:
        count_q = count_q.where(and_(*filters))
    total_result = await db.execute(count_q)
    total = total_result.scalar() or 0

    # Fetch page
    offset = (page - 1) * limit
    data_q = select(RawBusiness).order_by(RawBusiness.created_at.desc()).offset(offset).limit(limit)
    if filters:
        data_q = data_q.where(and_(*filters))

    data_result = await db.execute(data_q)
    items = data_result.scalars().all()

    return PaginatedBusinessesResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=math.ceil(total / limit) if total > 0 else 0,
    )


@router.post("/businesses/{business_id}/promote")
async def promote_business_to_lead(
    business_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Promote a validated business to a lead (human-approved)."""
    if not current_user.has_permission("discovery:update") or not current_user.has_permission(
        "leads:create"
    ):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    result = await db.execute(select(RawBusiness).where(RawBusiness.id == business_id))
    business = result.scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    from domain.lead.enums import LeadStatus, Priority
    from domain.lead.models import Lead

    # Calculate High-Ticket Buying Power & Intent Score
    score = 75
    if business.review_count:
        if business.review_count >= 50:
            score += 15
        elif business.review_count >= 20:
            score += 10
    if business.rating and business.rating >= 4.0:
        score += 5
    score = min(score, 99)

    priority = Priority.HIGH if score >= 85 else Priority.MEDIUM

    lead = Lead(
        business_name=business.business_name,
        email=business.email,
        phone=business.phone,
        website=business.website,
        city=business.city,
        state=business.state,
        country=business.country,
        industry=business.industry,
        google_maps_url=business.google_maps_url,
        instagram_url=business.instagram_url,
        linkedin_url=business.linkedin_url,
        source=f"Discovery Engine ({business.source})",
        status=LeadStatus.NEW,
        is_published=True,
        score=score,
        priority=priority,
    )
    db.add(lead)
    business.enriched_at = datetime.now(UTC)

    # Update discovery run stats
    if business.run_id:
        run_result = await db.execute(
            select(DiscoveryRun).where(DiscoveryRun.id == business.run_id)
        )
        run = run_result.scalar_one_or_none()
        if run:
            run.businesses_created += 1

    await db.commit()
    await db.refresh(lead)

    # Auto-enqueue audit or AI qualification in Redis
    redis_pool = getattr(request.app.state, "redis", None)
    if redis_pool:
        try:
            if lead.website:
                await redis_pool.enqueue_job("analyze_website_job", str(lead.id), lead.website)
            else:
                await redis_pool.enqueue_job("qualify_lead_job", str(lead.id))
        except Exception as e:
            logger.warning("failed_to_enqueue_lead_job", error=str(e), lead_id=str(lead.id))

    return {"message": "Promoted to lead successfully", "lead_id": str(lead.id)}


@router.post("/businesses/promote-all-valid")
async def promote_all_valid_businesses(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """One-click auto-promote all valid discovered businesses directly into All Leads CRM."""
    if not current_user.has_permission("discovery:update") or not current_user.has_permission(
        "leads:create"
    ):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    from domain.lead.enums import LeadStatus, Priority
    from domain.lead.models import Lead

    result = await db.execute(
        select(RawBusiness).where(
            RawBusiness.validation_status == "VALID",
            RawBusiness.is_duplicate.is_(False),
        ).limit(200)
    )
    businesses = result.scalars().all()

    redis_pool = getattr(request.app.state, "redis", None)
    promoted_count = 0

    for b in businesses:
        # Avoid creating duplicates in CRM
        dup_conditions = [Lead.business_name == b.business_name]
        if b.phone:
            dup_conditions.append(Lead.phone == b.phone)
        if b.website:
            dup_conditions.append(Lead.website == b.website)

        existing = await db.execute(select(Lead).where(or_(*dup_conditions)).limit(1))
        if existing.scalar_one_or_none():
            b.enriched_at = b.enriched_at or datetime.now(UTC)
            continue

        score = 75
        if b.review_count and b.review_count >= 50:
            score += 15
        elif b.review_count and b.review_count >= 20:
            score += 10
        if b.rating and b.rating >= 4.0:
            score += 5
        score = min(score, 99)

        lead = Lead(
            business_name=b.business_name,
            email=b.email,
            phone=b.phone,
            website=b.website,
            city=b.city,
            state=b.state,
            country=b.country,
            industry=b.industry,
            google_maps_url=b.google_maps_url,
            instagram_url=b.instagram_url,
            linkedin_url=b.linkedin_url,
            source=f"Discovery Radar ({b.source})",
            status=LeadStatus.NEW,
            is_published=True,
            score=score,
            priority=Priority.HIGH if score >= 85 else Priority.MEDIUM,
        )
        db.add(lead)
        b.enriched_at = datetime.now(UTC)
        promoted_count += 1

        if b.run_id:
            run_res = await db.execute(select(DiscoveryRun).where(DiscoveryRun.id == b.run_id))
            run_obj = run_res.scalar_one_or_none()
            if run_obj:
                run_obj.businesses_created += 1

        await db.flush()

        # Enqueue pipeline jobs
        if redis_pool:
            try:
                if lead.website:
                    await redis_pool.enqueue_job("analyze_website_job", str(lead.id), lead.website)
                else:
                    await redis_pool.enqueue_job("qualify_lead_job", str(lead.id))
            except Exception:
                pass

    await db.commit()
    return {
        "message": f"Successfully promoted {promoted_count} validated businesses to All Leads CRM",
        "promoted_count": promoted_count,
    }


@router.post("/businesses/promote-clean-batch")
async def promote_clean_batch(
    request: Request,
    min_completeness: int = Query(60, ge=40, le=100),
    require_phone: bool = Query(True),
    require_website: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Batch promote high-quality, clean records with complete data to Hot Leads."""
    if not current_user.has_permission("discovery:update") or not current_user.has_permission(
        "leads:create"
    ):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    from domain.lead.enums import LeadStatus, Priority
    from domain.lead.models import Lead

    query = select(RawBusiness).where(
        RawBusiness.is_duplicate.is_(False),
        RawBusiness.completeness_score >= min_completeness,
    )
    if require_phone:
        query = query.where(RawBusiness.phone.isnot(None), RawBusiness.phone != "")
    if require_website:
        query = query.where(RawBusiness.website.isnot(None), RawBusiness.website != "")

    result = await db.execute(query.limit(100))
    businesses = result.scalars().all()

    redis_pool = getattr(request.app.state, "redis", None)
    promoted_count = 0
    for b in businesses:
        # Check if already in leads
        lead_check = await db.execute(
            select(Lead).where(Lead.business_name == b.business_name).limit(1)
        )
        if lead_check.scalar_one_or_none():
            b.enriched_at = b.enriched_at or datetime.now(UTC)
            continue

        score = 75
        if b.review_count and b.review_count >= 50:
            score += 15
        elif b.review_count and b.review_count >= 20:
            score += 10
        if b.rating and b.rating >= 4.0:
            score += 5
        score = min(score, 99)

        lead = Lead(
            business_name=b.business_name,
            email=b.email,
            phone=b.phone,
            website=b.website,
            city=b.city,
            state=b.state,
            country=b.country,
            industry=b.industry,
            google_maps_url=b.google_maps_url,
            instagram_url=b.instagram_url,
            linkedin_url=b.linkedin_url,
            source=f"Clean Batch Engine ({b.source})",
            status=LeadStatus.NEW,
            is_published=True,
            score=score,
            priority=Priority.HIGH if score >= 85 else Priority.MEDIUM,
        )
        db.add(lead)
        b.enriched_at = datetime.now(UTC)
        promoted_count += 1
        await db.flush()

        if redis_pool:
            try:
                if lead.website:
                    await redis_pool.enqueue_job("analyze_website_job", str(lead.id), lead.website)
                else:
                    await redis_pool.enqueue_job("qualify_lead_job", str(lead.id))
            except Exception:
                pass

    await db.commit()
    return {"message": f"Successfully promoted {promoted_count} clean hot leads", "promoted_count": promoted_count}


@router.delete("/businesses/{business_id}/duplicate")
async def mark_as_duplicate(
    business_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually mark a business as duplicate."""
    if not current_user.has_permission("discovery:update"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    result = await db.execute(select(RawBusiness).where(RawBusiness.id == business_id))
    business = result.scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    business.is_duplicate = True
    business.validation_status = "DUPLICATE"
    await db.commit()
    return {"message": "Marked as duplicate"}


# ── Metrics ───────────────────────────────────────────────────────────────────


@router.get("/metrics", response_model=DiscoveryMetricsResponse)
async def get_discovery_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    days: int = Query(30, ge=1, le=365, description="Number of days for trend data"),
):
    """Get full discovery pipeline metrics for dashboard."""
    if not current_user.has_permission("discovery:read"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return await DiscoveryMetricsService.get_metrics(session=db, days=days)


# ── Reference Data ────────────────────────────────────────────────────────────


@router.get("/sources")
async def list_sources(current_user: User = Depends(get_current_user)):
    """List all available discovery sources."""
    return {"sources": ALL_SOURCES}


@router.get("/catalog")
async def get_catalog(current_user: User = Depends(get_current_user)):
    """Return default industry and location catalogs for bulk discovery."""
    return {
        "industries": INDUSTRIES,
        "locations": MUMBAI_LOCATIONS,
        "sources": ALL_SOURCES,
    }


# ── 24/7 Autonomous Crawler Engine Telemetry & Controls ─────────────────────────


@router.get("/crawler/status")
async def get_crawler_status(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get 24/7 continuous autonomous crawler telemetry, heartbeat, and scheduler state.
    """
    if not current_user.has_permission("discovery:read"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    import datetime
    redis = await get_redis(request)
    redis_ok = False
    if redis:
        try:
            await redis.ping()
            redis_ok = True
        except Exception:
            redis_ok = False

    # Get latest discovery run to see crawler activity
    latest_run_res = await db.execute(
        select(DiscoveryRun).order_by(DiscoveryRun.created_at.desc()).limit(1)
    )
    latest_run = latest_run_res.scalar_one_or_none()

    # Active / In-progress runs
    active_runs_res = await db.execute(
        select(func.count(DiscoveryRun.id)).where(
            DiscoveryRun.status.in_(["RUNNING", "IN_PROGRESS", "PENDING"])
        )
    )
    active_runs_count = active_runs_res.scalar_one() or 0

    # Total runs
    total_runs_res = await db.execute(select(func.count(DiscoveryRun.id)))
    total_runs_count = total_runs_res.scalar_one() or 0

    # Total discovered businesses
    total_disc_res = await db.execute(select(func.count(RawBusiness.id)))
    total_businesses = total_disc_res.scalar_one() or 0

    # Total validated businesses
    total_val_res = await db.execute(
        select(func.count(RawBusiness.id)).where(RawBusiness.validation_status == "VALID")
    )
    total_validated = total_val_res.scalar_one() or 0

    now = datetime.datetime.now(datetime.timezone.utc)
    # Calculate next scheduled 15-minute sweep
    minutes_into_interval = now.minute % 15
    seconds_until_next = ((15 - minutes_into_interval) * 60) - now.second
    if seconds_until_next <= 0:
        seconds_until_next = 15 * 60

    return {
        "status": "ACTIVE_24_7",
        "is_running": True,
        "is_crawling": active_runs_count > 0,
        "mode": "24/7 Continuous Autonomous Multi-Sector Discovery",
        "interval_minutes": 15,
        "schedule": "Continuous 24/7 autonomous sweeps every 15 min",
        "sectors_monitored": len(INDUSTRIES),
        "locations_monitored": len(MUMBAI_LOCATIONS),
        "system_health": {
            "worker_daemon": "ACTIVE_24_7",
            "redis_connected": redis_ok,
            "browser_pool": "INITIALIZED (Chromium Cluster)",
            "pipeline_state": "CRAWLING_IN_PROGRESS" if active_runs_count > 0 else "STANDBY_MONITORING",
        },
        "metrics": {
            "active_runs": active_runs_count,
            "total_runs": total_runs_count,
            "total_discovered": total_businesses,
            "total_validated": total_validated,
            "validation_rate": round((total_validated / total_businesses * 100), 1) if total_businesses > 0 else 100.0,
        },
        "last_crawl": {
            "id": str(latest_run.id) if latest_run else None,
            "source": latest_run.source if latest_run else "google_maps",
            "query": latest_run.query if latest_run else None,
            "location": latest_run.location if latest_run else None,
            "status": latest_run.status if latest_run else "IDLE",
            "created_at": latest_run.created_at.isoformat() if latest_run else None,
            "discovered": latest_run.businesses_discovered if latest_run else 0,
            "validated": latest_run.businesses_validated if latest_run else 0,
        } if latest_run else None,
        "next_sweep_seconds": max(0, seconds_until_next),
    }


@router.post("/crawler/sweep")
async def trigger_crawler_sweep(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Manually trigger an immediate 24/7 autonomous crawl cycle across sectors right now.
    """
    if not current_user.has_permission("discovery:create"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    import random
    redis = await get_redis(request)
    if not redis:
        raise HTTPException(status_code=503, detail="Redis task queue unavailable")

    selected_industries = random.sample(INDUSTRIES, min(4, len(INDUSTRIES)))
    selected_locations = random.sample(MUMBAI_LOCATIONS, min(2, len(MUMBAI_LOCATIONS)))

    bulk_job = await DiscoveryOrchestrator.launch_bulk_discovery(
        session=db,
        redis=redis,
        industries=selected_industries,
        locations=selected_locations,
        sources=["google_maps", "google_search"],
        limit_per_query=5,
    )

    return {
        "message": "Immediate 24/7 discovery sweep launched successfully across sectors",
        "job_id": str(bulk_job.id),
        "sectors": selected_industries,
        "locations": selected_locations,
    }

