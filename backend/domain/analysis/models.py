import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base


class WebsiteAnalysis(Base):
    __tablename__ = "website_analyses"

    lead_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, unique=True
    )

    website_url: Mapped[str] = mapped_column(String(255), nullable=False)

    website_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    seo_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mobile_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cta_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    social_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    digital_maturity_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    overall_score: Mapped[int | None] = mapped_column(Integer, nullable=True)

    strengths: Mapped[list[str]] = mapped_column(JSONB, server_default='[]', nullable=False)
    weaknesses: Mapped[list[str]] = mapped_column(JSONB, server_default='[]', nullable=False)
    pain_points: Mapped[list[str]] = mapped_column(JSONB, server_default='[]', nullable=False)

    analyzed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
