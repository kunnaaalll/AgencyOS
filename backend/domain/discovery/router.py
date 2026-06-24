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
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from arq.connections import ArqRedis
import structlog

logger = structlog.get_logger(__name__)

from api.deps import get_current_user
from core.database import get_db
from domain.discovery.models import DiscoveryBulkJob, DiscoveryRun, RawBusiness
from domain.discovery.schemas import (
    BulkDiscoveryRequest,
    BulkDiscoveryResponse,
    DiscoveryRunCreate,
    DiscoveryRunResponse,
    DiscoveryMetricsResponse,
    PaginatedBusinessesResponse,
    RawBusinessResponse,
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
                func.sum(func.cast(RawBusiness.validation_status == "VALID", type_=func.count().type)).label("validated"),
                func.sum(func.cast(RawBusiness.enriched_at.isnot(None), type_=func.count().type)).label("promoted"),
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
            func.sum(func.cast(RawBusiness.validation_status == "VALID", type_=func.count().type)).label("validated"),
            func.sum(func.cast(RawBusiness.enriched_at.isnot(None), type_=func.count().type)).label("promoted"),
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
        logger.warning("redis_unavailable", endpoint="/discovery/bulk", fallback="creating local job record without queueing")

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

    result = await db.execute(
        select(DiscoveryBulkJob).where(DiscoveryBulkJob.id == job_id)
    )
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
    status: Optional[str] = Query(None, description="Filter by validation_status"),
    source: Optional[str] = Query(None, description="Filter by source"),
    industry: Optional[str] = Query(None, description="Filter by industry"),
    city: Optional[str] = Query(None, description="Filter by city"),
    min_completeness: Optional[int] = Query(None, description="Minimum completeness score"),
    is_duplicate: Optional[bool] = Query(None, description="Filter duplicates"),
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
    data_q = (
        select(RawBusiness)
        .order_by(RawBusiness.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
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

    from domain.lead.models import Lead

    lead = Lead(
        business_name=business.business_name,
        email=business.email,
        phone=business.phone,
        website=business.website,
        source="Discovery Engine",
        status="NEW",
        is_published=False,
    )
    db.add(lead)

    # Update discovery run stats
    if business.run_id:
        run_result = await db.execute(
            select(DiscoveryRun).where(DiscoveryRun.id == business.run_id)
        )
        run = run_result.scalar_one_or_none()
        if run:
            run.businesses_created += 1

    await db.commit()
    return {"message": "Promoted to lead successfully", "lead_id": str(lead.id)}


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
