import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from domain.project.schemas import ProjectCreate, ProjectResponse, ProjectUpdate
from domain.project.services import ProjectService
from domain.role.dependencies import require_permissions
from domain.user.models import User

router = APIRouter(tags=["Projects"])


@router.get("/api/v1/clients/{id}/projects", response_model=list[ProjectResponse])
async def list_client_projects(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["projects:read"])),
):
    return await ProjectService.get_projects(db, id)


@router.post(
    "/api/v1/clients/{id}/projects",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_client_project(
    id: uuid.UUID,
    data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["projects:create"])),
):
    return await ProjectService.create_project(db, id, data)


@router.patch("/api/v1/projects/{id}", response_model=ProjectResponse)
async def update_project(
    id: uuid.UUID,
    data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["projects:update"])),
):
    return await ProjectService.update_project(db, id, data)


@router.delete("/api/v1/projects/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_permissions(["projects:update"])
    ),  # Usually update or separate delete
):
    await ProjectService.delete_project(db, id)
