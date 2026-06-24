import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from domain.role.dependencies import require_permissions
from domain.task.schemas import TaskCreate, TaskResponse, TaskUpdate
from domain.task.services import TaskService
from domain.user.models import User

router = APIRouter(tags=["Tasks"])


@router.get("/api/v1/projects/{id}/tasks", response_model=list[TaskResponse])
async def list_project_tasks(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["tasks:read"])),
):
    return await TaskService.get_tasks(db, id)


@router.post(
    "/api/v1/projects/{id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED
)
async def create_project_task(
    id: uuid.UUID,
    data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["tasks:create"])),
):
    return await TaskService.create_task(db, id, data)


@router.patch("/api/v1/tasks/{id}", response_model=TaskResponse)
async def update_task(
    id: uuid.UUID,
    data: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["tasks:update"])),
):
    return await TaskService.update_task(db, id, data)


@router.delete("/api/v1/tasks/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_permissions(["tasks:update"])
    ),  # Typically update or delete permission
):
    await TaskService.delete_task(db, id)
