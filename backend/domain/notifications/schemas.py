"""
AgencyOS V2 — Notification Schemas
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from .models import NotificationType


class NotificationBase(BaseModel):
    title: str
    message: str
    type: NotificationType
    is_read: bool = False


class NotificationCreate(NotificationBase):
    user_id: UUID | None = None


class NotificationResponse(NotificationBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    user_id: UUID | None
    created_at: datetime
    updated_at: datetime
