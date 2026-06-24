import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from domain.project.enums import ProjectStatus


class ProjectBase(BaseModel):
    name: str
    description: str | None = None
    status: ProjectStatus = ProjectStatus.PLANNING
    start_date: datetime | None = None
    due_date: datetime | None = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: ProjectStatus | None = None
    start_date: datetime | None = None
    due_date: datetime | None = None


class ProjectResponse(ProjectBase):
    id: uuid.UUID
    client_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
