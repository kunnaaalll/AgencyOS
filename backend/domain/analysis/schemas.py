from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class WebsiteAnalysisBase(BaseModel):
    website_url: str
    website_score: int | None = None
    seo_score: int | None = None
    mobile_score: int | None = None
    cta_score: int | None = None
    social_score: int | None = None
    digital_maturity_score: int | None = None
    overall_score: int | None = None

    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    pain_points: list[str] = Field(default_factory=list)


class WebsiteAnalysisCreate(WebsiteAnalysisBase):
    lead_id: UUID


class WebsiteAnalysisResponse(WebsiteAnalysisBase):
    id: UUID
    lead_id: UUID
    business_name: str | None = None
    analyzed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

