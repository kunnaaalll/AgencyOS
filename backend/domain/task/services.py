import uuid
from typing import Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from domain.task.models import Task
from domain.task.schemas import TaskCreate, TaskUpdate
from domain.task.events import TaskCreatedEvent
from events.dispatcher import dispatch_event
from domain.project.services import ProjectService

class TaskService:
    @staticmethod
    async def get_tasks(db: AsyncSession, project_id: uuid.UUID) -> Sequence[Task]:
        stmt = select(Task).where(Task.project_id == project_id).order_by(Task.created_at.desc())
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_task(db: AsyncSession, task_id: uuid.UUID) -> Task:
        stmt = select(Task).where(Task.id == task_id)
        result = await db.execute(stmt)
        task = result.scalar_one_or_none()
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        return task

    @staticmethod
    async def create_task(db: AsyncSession, project_id: uuid.UUID, data: TaskCreate) -> Task:
        await ProjectService.get_project(db, project_id) # Verify project exists
        
        task = Task(
            project_id=project_id,
            title=data.title,
            description=data.description,
            status=data.status,
            priority=data.priority,
            assigned_to=data.assigned_to,
            due_date=data.due_date,
            completed_at=data.completed_at,
        )
        db.add(task)
        await db.flush()

        await dispatch_event(
            TaskCreatedEvent(
                task_id=str(task.id),
                project_id=str(task.project_id),
                title=task.title
            )
        )
        return task

    @staticmethod
    async def update_task(db: AsyncSession, task_id: uuid.UUID, data: TaskUpdate) -> Task:
        task = await TaskService.get_task(db, task_id)
        
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(task, key, value)
            
        await db.flush()
        return task

    @staticmethod
    async def delete_task(db: AsyncSession, task_id: uuid.UUID) -> None:
        task = await TaskService.get_task(db, task_id)
        await db.delete(task)
        await db.flush()
