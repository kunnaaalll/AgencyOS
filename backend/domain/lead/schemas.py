import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from domain.lead.enums import LeadStatus, Priority


class LeadBase(BaseModel):
    business_name: str
    website: str | None = None
    industry: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    phone: str | None = None
    email: str | None = None
    instagram_url: str | None = None
    linkedin_url: str | None = None
    google_maps_url: str | None = None
    source: str | None = None

class LeadCreate(LeadBase):
    pass

class LeadUpdate(LeadBase):
    business_name: str | None = None
    status: LeadStatus | None = None
    priority: Priority | None = None
    qualification_status: str | None = None
    score: int | None = None

class LeadResponse(LeadBase):
    id: uuid.UUID
    status: LeadStatus
    is_published: bool
    score: int | None
    priority: Priority | None
    qualification_status: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class LeadAnalysisBase(BaseModel):
    website_score: int | None = None
    seo_score: int | None = None
    instagram_score: int | None = None
    reviews_score: int | None = None
    cta_score: int | None = None
    digital_maturity_score: int | None = None
    total_score: int | None = None
    summary: str | None = None
    pain_points: list[str] = []
    strengths: list[str] = []
    weaknesses: list[str] = []

class LeadAnalysisCreate(LeadAnalysisBase):
    pass

class LeadAnalysisResponse(LeadAnalysisBase):
    id: uuid.UUID
    lead_id: uuid.UUID
    analyzed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class LeadStats(BaseModel):
    total_leads: int
    qualified_leads: int
    high_priority_leads: int
