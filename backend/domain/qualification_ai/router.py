from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from arq import create_pool
from arq.connections import RedisSettings

from api.deps import get_current_user, require_permission
from core.database import get_db
from core.config import settings
from domain.qualification_ai.models import AIQualification
from domain.qualification_ai.schemas import AIQualificationResponse
from domain.lead.models import Lead

router = APIRouter(prefix="/qualification", tags=["Qualification"])


async def get_redis_pool():
    return await create_pool(RedisSettings(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        password=settings.REDIS_PASSWORD,
        database=0
    ))


@router.post("/run/{lead_id}", status_code=status.HTTP_202_ACCEPTED)
async def run_qualification(
    lead_id: str,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_permission("qualification:create"))
) -> dict[str, str]:
    """Enqueue a background job to run AI qualification for a given lead."""
    # Check if lead exists
    lead = await db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Enqueue job
    redis_pool = await get_redis_pool()
    await redis_pool.enqueue_job("qualify_lead_job", str(lead_id))
    
    return {"message": "AI qualification job enqueued successfully"}


@router.get("/{lead_id}", response_model=AIQualificationResponse)
async def get_qualification(
    lead_id: str,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_permission("qualification:read"))
) -> Any:
    """Get AI qualification results for a specific lead."""
    result = await db.execute(
        select(AIQualification).where(AIQualification.lead_id == lead_id).order_by(AIQualification.created_at.desc())
    )
    qualification = result.scalars().first()
    
    if not qualification:
        raise HTTPException(status_code=404, detail="Qualification not found for this lead")
        
    return qualification


@router.get("", response_model=list[AIQualificationResponse])
async def list_qualifications(
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_permission("qualification:read"))
) -> Any:
    """List all AI qualifications."""
    result = await db.execute(select(AIQualification).order_by(AIQualification.created_at.desc()))
    return result.scalars().all()
