import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

from domain.crm.enums import PipelineStage, ActivityType, MeetingType

# ── Opportunity Schemas ────────────────────────────────────────

class OpportunityBase(BaseModel):
    title: str
    pipeline_stage: PipelineStage = PipelineStage.NEW
    value: int = 0
    probability: int = 10
    expected_close_date: Optional[datetime] = None
    notes: Optional[str] = None

class OpportunityCreate(OpportunityBase):
    lead_id: uuid.UUID
    owner_id: Optional[uuid.UUID] = None

class OpportunityUpdate(BaseModel):
    title: Optional[str] = None
    pipeline_stage: Optional[PipelineStage] = None
    value: Optional[int] = None
    probability: Optional[int] = None
    expected_close_date: Optional[datetime] = None
    notes: Optional[str] = None
    owner_id: Optional[uuid.UUID] = None

class OpportunityResponse(OpportunityBase):
    id: uuid.UUID
    lead_id: uuid.UUID
    owner_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# ── Activity Schemas ───────────────────────────────────────────

class ActivityBase(BaseModel):
    activity_type: ActivityType
    title: str
    description: Optional[str] = None
    scheduled_for: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class ActivityCreate(ActivityBase):
    user_id: uuid.UUID

class ActivityUpdate(BaseModel):
    activity_type: Optional[ActivityType] = None
    title: Optional[str] = None
    description: Optional[str] = None
    scheduled_for: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class ActivityResponse(ActivityBase):
    id: uuid.UUID
    opportunity_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# ── Meeting Schemas ────────────────────────────────────────────

class MeetingBase(BaseModel):
    meeting_type: MeetingType
    scheduled_at: datetime
    duration_minutes: int = 30
    location: Optional[str] = None
    meeting_notes: Optional[str] = None
    outcome: Optional[str] = None

class MeetingCreate(MeetingBase):
    pass

class MeetingUpdate(BaseModel):
    meeting_type: Optional[MeetingType] = None
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    location: Optional[str] = None
    meeting_notes: Optional[str] = None
    outcome: Optional[str] = None

class MeetingResponse(MeetingBase):
    id: uuid.UUID
    opportunity_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# ── Stats Schema ───────────────────────────────────────────────

class CRMStats(BaseModel):
    pipeline_value: int
    weighted_pipeline_value: int
    meetings_scheduled: int
    won_opportunities: int
    lost_opportunities: int
    conversion_rate: float
