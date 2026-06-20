import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from domain.lead.enums import LeadStatus, Priority


class Lead(Base):
    __tablename__ = "leads"

    business_name: Mapped[str] = mapped_column(String(255), nullable=False)
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    industry: Mapped[str | None] = mapped_column(String(100), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    instagram_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    linkedin_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    google_maps_url: Mapped[str | None] = mapped_column(String(2000), nullable=True)

    status: Mapped[LeadStatus] = mapped_column(
        SQLEnum(LeadStatus, name="leadstatus_enum"), default=LeadStatus.NEW, nullable=False
    )
    score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    priority: Mapped[Priority | None] = mapped_column(
        SQLEnum(Priority, name="priority_enum"), nullable=True
    )
    source: Mapped[str | None] = mapped_column(String(100), nullable=True)
    qualification_status: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Relationships
    analysis: Mapped["LeadAnalysis"] = relationship(
        "LeadAnalysis", back_populates="lead", uselist=False, cascade="all, delete-orphan"
    )

class LeadAnalysis(Base):
    __tablename__ = "lead_analyses"

    lead_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, unique=True
    )

    website_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    seo_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    instagram_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reviews_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cta_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    digital_maturity_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_score: Mapped[int | None] = mapped_column(Integer, nullable=True)

    summary: Mapped[str | None] = mapped_column(String, nullable=True)
    pain_points: Mapped[list[str]] = mapped_column(JSONB, server_default='[]', nullable=False)
    strengths: Mapped[list[str]] = mapped_column(JSONB, server_default='[]', nullable=False)
    weaknesses: Mapped[list[str]] = mapped_column(JSONB, server_default='[]', nullable=False)

    analyzed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    lead: Mapped["Lead"] = relationship("Lead", back_populates="analysis")
