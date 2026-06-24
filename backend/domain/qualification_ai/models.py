import uuid
from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from domain.qualification_ai.enums import Priority, QualificationStatus


class AIQualification(Base):
    __tablename__ = "ai_qualifications"
    lead_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True
    )
    website_analysis_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("website_analyses.id", ondelete="SET NULL"), nullable=True
    )

    priority = Column(SQLEnum(Priority), nullable=False, default=Priority.MEDIUM)
    opportunity_score = Column(Integer, nullable=False, default=0)
    qualification_status = Column(
        SQLEnum(QualificationStatus), nullable=False, default=QualificationStatus.REVIEW_REQUIRED
    )

    summary = Column(Text, nullable=True)
    pain_points = Column(JSON, nullable=True, default=list)
    recommended_pitch = Column(Text, nullable=True)
    recommended_package = Column(String(255), nullable=True)
    confidence = Column(Float, nullable=False, default=0.0)

    model_used = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    lead = relationship("Lead", backref="ai_qualifications")
    # Assuming WebsiteAnalysis model uses website_analyses table and is imported in a way that relationship string works
    website_analysis = relationship("WebsiteAnalysis", backref="ai_qualifications")

    @property
    def business_name(self) -> str | None:
        return self.lead.business_name if getattr(self, "lead", None) else None
