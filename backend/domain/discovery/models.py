from datetime import datetime
from sqlalchemy import String, Integer, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base

class DiscoveryJob(Base):
    __tablename__ = "discovery_jobs"

    source: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="PENDING")
    
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    businesses_found: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    businesses_validated: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    errors: Mapped[list[str]] = mapped_column(JSONB, server_default='[]', nullable=False)
