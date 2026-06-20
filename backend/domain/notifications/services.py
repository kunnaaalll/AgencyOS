"""
AgencyOS V2 — Notification Services
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from .models import Notification
from .schemas import NotificationCreate

class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_notification(self, data: NotificationCreate) -> Notification:
        db_notif = Notification(**data.model_dump())
        self.db.add(db_notif)
        await self.db.flush()
        return db_notif

    async def mark_read(self, notification_id: UUID) -> Notification | None:
        stmt = select(Notification).where(Notification.id == notification_id)
        result = await self.db.execute(stmt)
        db_notif = result.scalar_one_or_none()
        if db_notif:
            db_notif.is_read = True
            await self.db.flush()
        return db_notif

    async def list_notifications(self, user_id: UUID, limit: int = 50, offset: int = 0) -> list[Notification]:
        stmt = select(Notification).where(Notification.user_id == user_id).order_by(Notification.created_at.desc()).limit(limit).offset(offset)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
