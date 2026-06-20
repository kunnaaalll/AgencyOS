"""
AgencyOS V2 — Generic Async Repository Base
Provides standard CRUD operations for any SQLAlchemy model.
"""

from typing import Any, Generic, TypeVar
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """
    Generic async repository providing standard CRUD operations.
    Subclass and set `model` to the target SQLAlchemy model.
    """

    model: type[ModelType]

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get(self, id: UUID) -> ModelType | None:
        """Fetch a single record by primary key."""
        return await self.db.get(self.model, id)

    async def get_all(
        self,
        *,
        skip: int = 0,
        limit: int = 50,
        filters: dict[str, Any] | None = None,
    ) -> tuple[list[ModelType], int]:
        """
        Fetch a paginated list of records.
        Returns (items, total_count).
        """
        query = select(self.model)
        count_query = select(func.count()).select_from(self.model)

        if filters:
            for field, value in filters.items():
                if hasattr(self.model, field):
                    query = query.where(getattr(self.model, field) == value)
                    count_query = count_query.where(getattr(self.model, field) == value)

        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()

        result = await self.db.execute(query.offset(skip).limit(limit))
        items = list(result.scalars().all())

        return items, total

    async def create(self, **kwargs: Any) -> ModelType:
        """Create and persist a new record."""
        instance = self.model(**kwargs)
        self.db.add(instance)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    async def update(self, instance: ModelType, **kwargs: Any) -> ModelType:
        """Update fields on an existing record."""
        for key, value in kwargs.items():
            if hasattr(instance, key) and value is not None:
                setattr(instance, key, value)
        self.db.add(instance)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    async def delete(self, instance: ModelType) -> None:
        """Delete a record."""
        await self.db.delete(instance)
        await self.db.flush()

    async def count(self, filters: dict[str, Any] | None = None) -> int:
        """Count records matching optional filters."""
        query = select(func.count()).select_from(self.model)
        if filters:
            for field, value in filters.items():
                if hasattr(self.model, field):
                    query = query.where(getattr(self.model, field) == value)
        result = await self.db.execute(query)
        return result.scalar_one()
