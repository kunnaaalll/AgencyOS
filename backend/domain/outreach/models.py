from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Enum as SQLEnum, JSON, Text
from sqlalchemy.orm import relationship

from core.database import Base
from domain.outreach.enums import OutreachChannel, DraftStatus


class OutreachDraft(Base):
    __tablename__ = "outreach_drafts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    qualification_id = Column(String(36), ForeignKey("ai_qualifications.id", ondelete="SET NULL"), nullable=True)
    
    channel = Column(SQLEnum(OutreachChannel), nullable=False)
    status = Column(SQLEnum(DraftStatus), nullable=False, default=DraftStatus.DRAFT)
    
    subject = Column(String(255), nullable=True)
    message = Column(Text, nullable=False)
    talking_points = Column(JSON, nullable=True, default=list)
    
    model_used = Column(String(100), nullable=True)
    tokens_used = Column(Integer, nullable=True, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    lead = relationship("Lead", backref="outreach_drafts")
    qualification = relationship("AIQualification", backref="outreach_drafts")
