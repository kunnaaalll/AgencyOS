"""
AgencyOS V2 — Backup Schemas
"""

from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from .models import BackupStatus

class BackupRecordBase(BaseModel):
    backup_type: str
    status: BackupStatus
    file_size: int | None = None
    storage_location: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None

from pydantic import BaseModel, ConfigDict, Field, AliasChoices

class BackupRecordCreate(BaseModel):
    backup_type: str = Field(..., validation_alias=AliasChoices("backup_type", "type", "backupType"))

class BackupRecordResponse(BackupRecordBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    created_at: datetime
    updated_at: datetime
