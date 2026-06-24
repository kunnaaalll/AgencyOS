"""
AgencyOS V2 — Audit Services
"""


from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import AuditLog
from .schemas import AuditLogCreate


class AuditLogService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_log(self, data: AuditLogCreate) -> AuditLog:
        db_log = AuditLog(**data.model_dump())
        self.db.add(db_log)
        await self.db.flush()
        return db_log

    async def list_logs(self, limit: int = 100, offset: int = 0) -> list[AuditLog]:
        stmt = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).offset(offset)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
