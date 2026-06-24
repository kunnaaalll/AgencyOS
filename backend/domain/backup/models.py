"""
AgencyOS V2 — Backup Models
"""

import enum
from datetime import datetime

from sqlalchemy import Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base


class BackupStatus(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class BackupRecord(Base):
    """
    Tracks database and system backups.
    """

    __tablename__ = "backup_records"

    backup_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # e.g. "FULL", "POSTGRES_ONLY"
    status: Mapped[BackupStatus] = mapped_column(
        Enum(BackupStatus), default=BackupStatus.PENDING, nullable=False, index=True
    )
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)  # in bytes
    storage_location: Mapped[str | None] = mapped_column(String(500), nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(nullable=True)

    def __repr__(self) -> str:
        return f"<BackupRecord id={self.id} status={self.status.value}>"
