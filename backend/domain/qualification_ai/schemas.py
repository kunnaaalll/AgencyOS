from datetime import datetime
from pydantic import BaseModel, ConfigDict
from domain.qualification_ai.enums import Priority, QualificationStatus


class AIQualificationBase(BaseModel):
    lead_id: str
    website_analysis_id: str | None = None
    priority: Priority = Priority.MEDIUM
    opportunity_score: int = 0
    qualification_status: QualificationStatus = QualificationStatus.REVIEW_REQUIRED
    summary: str | None = None
    pain_points: list[str] = []
    recommended_pitch: str | None = None
    recommended_package: str | None = None
    confidence: float = 0.0
    model_used: str | None = None


class AIQualificationCreate(AIQualificationBase):
    pass


class AIQualificationResponse(AIQualificationBase):
    id: str
    created_at: datetime
    business_name: str | None = None

    model_config = ConfigDict(from_attributes=True)


class AIOutputSchema(BaseModel):
    priority: Priority
    opportunity_score: int
    qualification_status: QualificationStatus
    summary: str
    pain_points: list[str]
    recommended_pitch: str
    recommended_package: str
    confidence: float
