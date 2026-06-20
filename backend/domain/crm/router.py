import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from domain.auth.deps import require_permissions
from domain.crm.schemas import (
    ActivityCreate,
    ActivityResponse,
    ActivityUpdate,
    CRMStats,
    MeetingCreate,
    MeetingResponse,
    MeetingUpdate,
    OpportunityCreate,
    OpportunityResponse,
    OpportunityUpdate,
)
from domain.crm.services import CRMService

router = APIRouter(prefix="/crm", tags=["CRM"])

# ── Opportunities ──────────────────────────────────────────────

@router.get("/opportunities", response_model=list[OpportunityResponse])
async def get_opportunities(
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_permissions(["crm:read"]))
):
    return await CRMService.get_opportunities(db)

@router.get("/opportunities/stats", response_model=CRMStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_permissions(["crm:read"]))
):
    return await CRMService.get_stats(db)

@router.post("/opportunities", response_model=OpportunityResponse, status_code=status.HTTP_201_CREATED)
async def create_opportunity(
    data: OpportunityCreate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_permissions(["crm:create"]))
):
    return await CRMService.create_opportunity(db, data)

@router.get("/opportunities/{id}", response_model=OpportunityResponse)
async def get_opportunity(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_permissions(["crm:read"]))
):
    return await CRMService.get_opportunity(db, id)

@router.patch("/opportunities/{id}", response_model=OpportunityResponse)
async def update_opportunity(
    id: uuid.UUID,
    data: OpportunityUpdate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_permissions(["crm:update"]))
):
    return await CRMService.update_opportunity(db, id, data)

@router.delete("/opportunities/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_opportunity(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_permissions(["crm:delete"]))
):
    await CRMService.delete_opportunity(db, id)

# ── Activities ─────────────────────────────────────────────────

@router.get("/opportunities/{id}/activities", response_model=list[ActivityResponse])
async def get_activities(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_permissions(["crm:read"]))
):
    return await CRMService.get_activities(db, id)

@router.post("/opportunities/{id}/activities", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
async def create_activity(
    id: uuid.UUID,
    data: ActivityCreate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_permissions(["activities:create"]))
):
    return await CRMService.create_activity(db, id, data)

@router.patch("/activities/{id}", response_model=ActivityResponse)
async def update_activity(
    id: uuid.UUID,
    data: ActivityUpdate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_permissions(["activities:update"]))
):
    return await CRMService.update_activity(db, id, data)

@router.delete("/activities/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_activity(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_permissions(["crm:delete"]))
):
    await CRMService.delete_activity(db, id)

# ── Meetings ───────────────────────────────────────────────────

@router.get("/opportunities/{id}/meetings", response_model=list[MeetingResponse])
async def get_meetings(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_permissions(["crm:read"]))
):
    return await CRMService.get_meetings(db, id)

@router.post("/opportunities/{id}/meetings", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
async def create_meeting(
    id: uuid.UUID,
    data: MeetingCreate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_permissions(["meetings:create"]))
):
    return await CRMService.create_meeting(db, id, data)

@router.patch("/meetings/{id}", response_model=MeetingResponse)
async def update_meeting(
    id: uuid.UUID,
    data: MeetingUpdate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_permissions(["meetings:update"]))
):
    return await CRMService.update_meeting(db, id, data)

@router.delete("/meetings/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_meeting(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_permissions(["crm:delete"]))
):
    await CRMService.delete_meeting(db, id)
