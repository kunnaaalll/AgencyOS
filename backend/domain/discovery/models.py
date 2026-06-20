from datetime import datetime

from sqlalchemy import DateTime, Integer, String
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


class RawBusiness(Base):
    __tablename__ = "raw_businesses"

    source: Mapped[str] = mapped_column(String(100), nullable=False)
    business_name: Mapped[str] = mapped_column(String(255), nullable=False)
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    industry: Mapped[str | None] = mapped_column(String(100), nullable=True)
    google_maps_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    raw_payload: Mapped[dict] = mapped_column(JSONB, server_default='{}', nullable=False)
    validation_status: Mapped[str] = mapped_column(String(50), nullable=False, default="PENDING")
