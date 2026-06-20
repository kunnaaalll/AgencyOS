from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Enum as SQLEnum, JSON, Text
from sqlalchemy.orm import relationship

from core.database import Base
from domain.qualification_ai.enums import Priority, QualificationStatus


class AIQualification(Base):
    __tablename__ = "ai_qualifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    website_analysis_id = Column(String(36), ForeignKey("website_analyses.id", ondelete="SET NULL"), nullable=True)
    
    priority = Column(SQLEnum(Priority), nullable=False, default=Priority.MEDIUM)
    opportunity_score = Column(Integer, nullable=False, default=0)
    qualification_status = Column(SQLEnum(QualificationStatus), nullable=False, default=QualificationStatus.REVIEW_REQUIRED)
    
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
