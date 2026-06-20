import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional

from domain.task.enums import TaskStatus, TaskPriority

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    assigned_to: Optional[uuid.UUID] = None
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assigned_to: Optional[uuid.UUID] = None
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class TaskResponse(TaskBase):
    id: uuid.UUID
    project_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
