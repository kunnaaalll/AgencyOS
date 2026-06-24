from datetime import datetime
import uuid
from uuid import uuid4

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Enum as SQLEnum, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from domain.outreach.enums import OutreachChannel, DraftStatus


class OutreachDraft(Base):
    __tablename__ = "outreach_drafts"
    lead_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    qualification_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("ai_qualifications.id", ondelete="SET NULL"), nullable=True)
    
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

    @property
    def business_name(self) -> str | None:
        return self.lead.business_name if getattr(self, "lead", None) else None
