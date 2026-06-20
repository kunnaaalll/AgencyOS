import uuid
from collections.abc import Sequence

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from domain.client.services import ClientService
from domain.project.events import ProjectCreatedEvent
from domain.project.models import Project
from domain.project.schemas import ProjectCreate, ProjectUpdate
from events.dispatcher import dispatch_event


class ProjectService:
    @staticmethod
    async def get_projects(db: AsyncSession, client_id: uuid.UUID) -> Sequence[Project]:
        stmt = select(Project).where(Project.client_id == client_id).order_by(Project.created_at.desc())
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_project(db: AsyncSession, project_id: uuid.UUID) -> Project:
        stmt = select(Project).where(Project.id == project_id)
        result = await db.execute(stmt)
        project = result.scalar_one_or_none()
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        return project

    @staticmethod
    async def create_project(db: AsyncSession, client_id: uuid.UUID, data: ProjectCreate) -> Project:
        await ClientService.get_client(db, client_id) # Verify client exists

        project = Project(
            client_id=client_id,
            name=data.name,
            description=data.description,
            status=data.status,
            start_date=data.start_date,
            due_date=data.due_date,
        )
        db.add(project)
        await db.flush()

        await dispatch_event(
            ProjectCreatedEvent(
                project_id=str(project.id),
                client_id=str(project.client_id),
                name=project.name
            )
        )
        return project

    @staticmethod
    async def update_project(db: AsyncSession, project_id: uuid.UUID, data: ProjectUpdate) -> Project:
        project = await ProjectService.get_project(db, project_id)

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(project, key, value)

        await db.flush()
        return project

    @staticmethod
    async def delete_project(db: AsyncSession, project_id: uuid.UUID) -> None:
        project = await ProjectService.get_project(db, project_id)
        await db.delete(project)
        await db.flush()
