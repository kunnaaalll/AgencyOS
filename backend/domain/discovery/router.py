import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.database import get_db
from api.deps import get_current_user
from domain.user.models import User
from domain.discovery.models import DiscoveryJob
from domain.discovery.schemas import DiscoveryJobCreate, DiscoveryJobResponse

router = APIRouter(prefix="/v1", tags=["Discovery"])

@router.get("/discovery/jobs", response_model=list[DiscoveryJobResponse])
async def list_discovery_jobs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    if not current_user.has_permission("leads:read"):
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    result = await db.execute(select(DiscoveryJob).offset(skip).limit(limit))
    return result.scalars().all()

@router.post("/discovery/jobs", response_model=DiscoveryJobResponse)
async def create_discovery_job(
    job_in: DiscoveryJobCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.has_permission("leads:create"):
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    job = DiscoveryJob(**job_in.model_dump())
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job
