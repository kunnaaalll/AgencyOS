"""
AgencyOS V2 — Audit Log Schemas
"""

from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Any

class AuditLogBase(BaseModel):
    user_id: UUID | None = None
    entity_type: str
    entity_id: str | None = None
    action: str
    old_values: dict[str, Any] | None = None
    new_values: dict[str, Any] | None = None

class AuditLogCreate(AuditLogBase):
    pass

class AuditLogResponse(AuditLogBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    created_at: datetime
    updated_at: datetime
