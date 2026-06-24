from datetime import datetime
from pydantic import BaseModel, ConfigDict
from domain.outreach.enums import OutreachChannel, DraftStatus


class OutreachDraftBase(BaseModel):
    lead_id: str
    qualification_id: str | None = None
    channel: OutreachChannel
    status: DraftStatus = DraftStatus.DRAFT
    subject: str | None = None
    message: str
    talking_points: list[str] = []
    model_used: str | None = None
    tokens_used: int = 0


class OutreachDraftCreate(OutreachDraftBase):
    pass


class OutreachDraftUpdate(BaseModel):
    subject: str | None = None
    message: str | None = None
    talking_points: list[str] | None = None
    status: DraftStatus | None = None


class OutreachDraftResponse(OutreachDraftBase):
    id: str
    created_at: datetime
    updated_at: datetime
    business_name: str | None = None

    model_config = ConfigDict(from_attributes=True)


class AIOutreachOutputSchema(BaseModel):
    subject: str
    message: str
    talking_points: list[str]
