import uuid
from datetime import datetime, UTC
from sqlalchemy import select
from core.database import AsyncSessionFactory
from domain.discovery.models import DiscoveryRun, RawBusiness
from services.discovery.sources import GoogleMapsSource, GoogleSearchSource, RedditSource
from services.validation.service import ValidationService
from services.enrichment.service import EnrichmentService

async def discover_businesses(ctx: dict, run_id: str, limit: int) -> None:
    async with AsyncSessionFactory() as session:
        result = await session.execute(select(DiscoveryRun).where(DiscoveryRun.id == uuid.UUID(run_id)))
        run = result.scalar_one_or_none()
        if not run:
            return

        run.status = "RUNNING"
        run.started_at = datetime.now(UTC)
        await session.commit()
        
        source_map = {
            "google_maps": GoogleMapsSource(),
            "google_search": GoogleSearchSource(),
            "reddit": RedditSource(),
        }
        
        source_instance = source_map.get(run.source)
        if not source_instance:
            run.status = "FAILED"
            run.error_message = f"Unknown source: {run.source}"
            run.completed_at = datetime.now(UTC)
            await session.commit()
            return
            
        try:
            raw_businesses_dicts = await source_instance.discover(
                query=run.query or "", 
                location=run.location or "", 
                limit=limit
            )
            
            run.businesses_discovered = len(raw_businesses_dicts)
            
            # Save raw businesses and trigger validation
            redis = ctx.get("redis")
            for b_dict in raw_businesses_dicts:
                business = RawBusiness(
                    source=run.source,
                    business_name=b_dict.get("business_name", ""),
                    website=b_dict.get("website"),
                    phone=b_dict.get("phone"),
                    email=b_dict.get("email"),
                    address=b_dict.get("address"),
                    city=b_dict.get("city"),
                    state=b_dict.get("state"),
                    country=b_dict.get("country"),
                    industry=b_dict.get("industry"),
                    google_maps_url=b_dict.get("google_maps_url"),
                    raw_payload=b_dict.get("raw_payload", {}),
                    validation_status="PENDING"
                )
                session.add(business)
                await session.flush()  # To get business.id
                
                # Enqueue validation
                if redis:
                    await redis.enqueue_job("validate_business", str(business.id))
            
            run.status = "COMPLETED"
        except Exception as e:
            run.status = "FAILED"
            run.error_message = str(e)
            
        run.completed_at = datetime.now(UTC)
        await session.commit()

async def validate_business(ctx: dict, business_id: str) -> None:
    async with AsyncSessionFactory() as session:
        result = await session.execute(select(RawBusiness).where(RawBusiness.id == uuid.UUID(business_id)))
        business = result.scalar_one_or_none()
        if not business:
            return
            
        b_dict = {
            "website": business.website,
            "email": business.email,
            "phone": business.phone
        }
        
        validated_dict = await ValidationService.validate_business(b_dict)
        business.validation_status = validated_dict.get("validation_status", "INVALID")
        
        await session.commit()
        
        if business.validation_status == "VALID":
            redis = ctx.get("redis")
            if redis:
                await redis.enqueue_job("enrich_business", business_id)

async def enrich_business(ctx: dict, business_id: str) -> None:
    async with AsyncSessionFactory() as session:
        result = await session.execute(select(RawBusiness).where(RawBusiness.id == uuid.UUID(business_id)))
        business = result.scalar_one_or_none()
        if not business:
            return
            
        b_dict = {
            "website": business.website,
            "raw_payload": business.raw_payload or {}
        }
        
        enriched_dict = await EnrichmentService.enrich_business(b_dict)
        
        # SQLAlchemy requires assigning a new dict object to trigger JSONB updates
        business.raw_payload = dict(enriched_dict.get("raw_payload", {}))
        
        await session.commit()
