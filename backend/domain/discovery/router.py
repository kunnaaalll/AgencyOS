import uuid
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from arq.connections import ArqRedis

from api.deps import get_current_user
from core.database import get_db
from domain.discovery.models import DiscoveryRun, RawBusiness
from domain.discovery.schemas import DiscoveryRunCreate, DiscoveryRunResponse, RawBusinessResponse
from domain.user.models import User
from services.discovery.service import DiscoveryService

# Assuming Redis is attached to app.state.redis in main.py, or we create a dependency.
# For simplicity, we'll get it from request.app.state.redis.
async def get_redis(request: Request) -> ArqRedis:
    return getattr(request.app.state, "redis", None)

router = APIRouter(prefix="/v1/discovery", tags=["Discovery"])

@router.post("/run", response_model=DiscoveryRunResponse)
async def create_discovery_run(
    run_in: DiscoveryRunCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
    limit: int = 100
):
    if not current_user.has_permission("discovery:read"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    result = await db.execute(select(DiscoveryRun).order_by(DiscoveryRun.created_at.desc()).offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/runs/{run_id}", response_model=DiscoveryRunResponse)
async def get_discovery_run(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.has_permission("discovery:read"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    result = await db.execute(select(DiscoveryRun).where(DiscoveryRun.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run

@router.get("/businesses", response_model=list[RawBusinessResponse])
async def list_raw_businesses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    if not current_user.has_permission("discovery:read"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    result = await db.execute(select(RawBusiness).order_by(RawBusiness.created_at.desc()).offset(skip).limit(limit))
    return result.scalars().all()

@router.post("/businesses/{business_id}/promote")
async def promote_business_to_lead(
    business_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.has_permission("discovery:update") or not current_user.has_permission("leads:create"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    result = await db.execute(select(RawBusiness).where(RawBusiness.id == business_id))
    business = result.scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
        
    from domain.lead.models import Lead # Delayed import to avoid circular dependency
    
    lead = Lead(
        name=business.business_name,
        email=business.email,
        phone=business.phone,
        website=business.website,
        source="Discovery Engine",
        status="NEW"
    )
    db.add(lead)
    
    # Update stats
    run_result = await db.execute(select(DiscoveryRun).where(DiscoveryRun.source == business.source).order_by(DiscoveryRun.created_at.desc()).limit(1))
    run = run_result.scalar_one_or_none()
    if run:
        run.businesses_created += 1
        
    await db.commit()
    return {"message": "Promoted to lead successfully", "lead_id": lead.id}
