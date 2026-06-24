import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from domain.crm.enums import ActivityType, MeetingType, PipelineStage

# ── Opportunity Schemas ────────────────────────────────────────


class OpportunityBase(BaseModel):
    title: str
    pipeline_stage: PipelineStage = PipelineStage.NEW
    value: int = 0
    probability: int = 10
    expected_close_date: datetime | None = None
    notes: str | None = None


class OpportunityCreate(OpportunityBase):
    lead_id: uuid.UUID
    owner_id: uuid.UUID | None = None


class OpportunityUpdate(BaseModel):
    title: str | None = None
    pipeline_stage: PipelineStage | None = None
    value: int | None = None
    probability: int | None = None
    expected_close_date: datetime | None = None
    notes: str | None = None
    owner_id: uuid.UUID | None = None


class OpportunityResponse(OpportunityBase):
    id: uuid.UUID
    lead_id: uuid.UUID
    owner_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ── Activity Schemas ───────────────────────────────────────────


class ActivityBase(BaseModel):
    activity_type: ActivityType
    title: str
    description: str | None = None
    scheduled_for: datetime | None = None
    completed_at: datetime | None = None


class ActivityCreate(ActivityBase):
    user_id: uuid.UUID


class ActivityUpdate(BaseModel):
    activity_type: ActivityType | None = None
    title: str | None = None
    description: str | None = None
    scheduled_for: datetime | None = None
    completed_at: datetime | None = None


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
    location: str | None = None
    meeting_notes: str | None = None
    outcome: str | None = None


class MeetingCreate(MeetingBase):
    pass


class MeetingUpdate(BaseModel):
    meeting_type: MeetingType | None = None
    scheduled_at: datetime | None = None
    duration_minutes: int | None = None
    location: str | None = None
    meeting_notes: str | None = None
    outcome: str | None = None


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
