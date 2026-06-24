"""
AgencyOS V2 — Automation OS Services
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import WorkflowExecution


class WorkflowExecutionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_executions(self, limit: int = 100, offset: int = 0) -> list[WorkflowExecution]:
        stmt = select(WorkflowExecution).order_by(WorkflowExecution.created_at.desc()).limit(limit).offset(offset)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_execution(self, execution_id: UUID) -> WorkflowExecution | None:
        stmt = select(WorkflowExecution).where(WorkflowExecution.id == execution_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
