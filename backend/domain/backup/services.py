"""
AgencyOS V2 — Backup Services
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from .models import BackupRecord, BackupStatus
from .schemas import BackupRecordCreate
from datetime import datetime

class BackupService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_backup(self, data: BackupRecordCreate) -> BackupRecord:
        db_backup = BackupRecord(
            backup_type=data.backup_type,
            status=BackupStatus.PENDING,
            started_at=datetime.utcnow()
        )
        self.db.add(db_backup)
        await self.db.commit()
        await self.db.refresh(db_backup)
        # In a real scenario, this would trigger an ARQ task to perform the actual backup.
        # Here we just record metadata.
        return db_backup

    async def list_backups(self, limit: int = 50, offset: int = 0) -> list[BackupRecord]:
        stmt = select(BackupRecord).order_by(BackupRecord.created_at.desc()).limit(limit).offset(offset)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def restore_backup(self, backup_id: UUID):
        # As per constraints: Do not restore automatically
        raise NotImplementedError("Automatic backup restoration is not supported.")
