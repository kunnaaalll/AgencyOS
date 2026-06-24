import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user
from core.database import get_db
from domain.lead.models import Lead, LeadAnalysis
from domain.lead.schemas import (
    LeadAnalysisCreate,
    LeadAnalysisResponse,
    LeadCreate,
    LeadResponse,
    LeadStats,
    LeadUpdate,
)
from domain.user.models import User

router = APIRouter(tags=["Leads"])


@router.get("/leads", response_model=list[LeadResponse])
async def list_leads(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    is_published: bool | None = None,
    min_score: int | None = None,
):
    if not current_user.has_permission("leads:read"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    query = select(Lead)
    if is_published is not None:
        query = query.where(Lead.is_published == is_published)
    if min_score is not None:
        query = query.where(Lead.score >= min_score)

    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.post("/leads/{lead_id}/publish", response_model=LeadResponse)
async def publish_lead(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.has_permission("leads:update"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead.is_published = True
    await db.commit()
    await db.refresh(lead)
    return lead


@router.post("/leads", response_model=LeadResponse)
async def create_lead(
    lead_in: LeadCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.has_permission("leads:create"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    lead = Lead(**lead_in.model_dump())
    db.add(lead)
    await db.commit()
    await db.refresh(lead)
    return lead


@router.get("/leads/stats", response_model=LeadStats)
async def get_lead_stats(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    if not current_user.has_permission("leads:read"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    total = await db.scalar(select(func.count()).select_from(Lead))
    qualified = await db.scalar(
        select(func.count()).select_from(Lead).where(Lead.status == "QUALIFIED")
    )
    high_priority = await db.scalar(
        select(func.count()).select_from(Lead).where(Lead.priority == "HIGH")
    )

    return LeadStats(
        total_leads=total or 0,
        qualified_leads=qualified or 0,
        high_priority_leads=high_priority or 0,
    )


@router.get("/leads/{id}", response_model=LeadResponse)
async def get_lead(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.has_permission("leads:read"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    lead = await db.get(Lead, id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.patch("/leads/{id}", response_model=LeadResponse)
async def update_lead(
    id: uuid.UUID,
    lead_in: LeadUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.has_permission("leads:update"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    lead = await db.get(Lead, id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    update_data = lead_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lead, field, value)

    await db.commit()
    await db.refresh(lead)
    return lead


@router.delete("/leads/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.has_permission("leads:delete"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    lead = await db.get(Lead, id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    await db.delete(lead)
    await db.commit()


@router.post("/analysis/{lead_id}", response_model=LeadAnalysisResponse)
async def create_analysis(
    lead_id: uuid.UUID,
    analysis_in: LeadAnalysisCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.has_permission("analysis:create"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    lead = await db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    analysis = LeadAnalysis(lead_id=lead_id, **analysis_in.model_dump())
    db.add(analysis)
    await db.commit()
    await db.refresh(analysis)
    return analysis


@router.get("/analysis/{lead_id}", response_model=LeadAnalysisResponse)
async def get_analysis(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.has_permission("analysis:read"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    result = await db.execute(select(LeadAnalysis).where(LeadAnalysis.lead_id == lead_id))
    analysis = result.scalars().first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis
