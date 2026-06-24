import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base


class DiscoveryRun(Base):
    __tablename__ = "discovery_runs"

    source: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="PENDING")
    query: Mapped[str | None] = mapped_column(String(500), nullable=True)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)

    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    businesses_discovered: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    businesses_validated: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    businesses_created: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    error_message: Mapped[str | None] = mapped_column(String, nullable=True)


class DiscoveryBulkJob(Base):
    __tablename__ = "discovery_bulk_jobs"

    industries: Mapped[list] = mapped_column(JSONB, server_default="[]", nullable=False)
    locations: Mapped[list] = mapped_column(JSONB, server_default="[]", nullable=False)
    sources: Mapped[list] = mapped_column(JSONB, server_default="[]", nullable=False)
    limit_per_query: Mapped[int] = mapped_column(Integer, default=10, nullable=False)

    status: Mapped[str] = mapped_column(String(50), nullable=False, default="PENDING")
    total_queries: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completed_queries: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    failed_queries: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    businesses_discovered: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_message: Mapped[str | None] = mapped_column(String, nullable=True)


class RawBusiness(Base):
    __tablename__ = "raw_businesses"

    # Core identity
    source: Mapped[str] = mapped_column(String(100), nullable=False)
    business_name: Mapped[str] = mapped_column(String(255), nullable=False)
    website: Mapped[str | None] = mapped_column(String(500), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Location
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Classification
    industry: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Ratings
    rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    google_rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    review_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Google Maps specific
    google_maps_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    opening_hours: Mapped[dict] = mapped_column(JSONB, server_default="{}", nullable=False)

    # Social profiles (enriched)
    instagram_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    facebook_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    linkedin_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    youtube_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Website metadata (enriched)
    meta_title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    meta_description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Pipeline state
    completeness_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    validation_status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="PENDING"
    )
    enriched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_duplicate: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Attribution
    run_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("discovery_runs.id", ondelete="SET NULL"), nullable=True
    )

    # Raw scraped payload
    raw_payload: Mapped[dict] = mapped_column(JSONB, server_default="{}", nullable=False)
