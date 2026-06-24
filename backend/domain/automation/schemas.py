"""
AgencyOS V2 — Automation OS Schemas
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from .models import WorkflowStatus


class WorkflowExecutionBase(BaseModel):
    workflow_name: str
    status: WorkflowStatus
    started_at: datetime | None = None
    completed_at: datetime | None = None
    duration_ms: int | None = None
    error_message: str | None = None
    retry_count: int

class WorkflowExecutionCreate(WorkflowExecutionBase):
    pass

class WorkflowExecutionResponse(WorkflowExecutionBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    created_at: datetime
    updated_at: datetime
