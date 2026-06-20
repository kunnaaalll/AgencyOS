"""
AgencyOS V2 — Database Engine & Session Factory
SQLAlchemy 2.0 async with connection pooling.
"""

import uuid
from collections.abc import AsyncGenerator
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, MappedColumn, mapped_column

from core.config import settings

# ── Engine ────────────────────────────────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=5 if settings.is_production else 10,
    max_overflow=10 if settings.is_production else 20,
    pool_recycle=3600,
    pool_timeout=30,
    connect_args={
        "command_timeout": 30,  # Statement timeout in seconds
    },
)

# ── Session Factory ───────────────────────────────────────────
AsyncSessionFactory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


# ── Base Model ────────────────────────────────────────────────
class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy models.
    Provides common columns: id, created_at, updated_at.
    """

    id: MappedColumn[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    created_at: MappedColumn[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: MappedColumn[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# ── Dependency ────────────────────────────────────────────────
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that provides an async database session."""
    async with AsyncSessionFactory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def check_database_connection() -> bool:
    """Health check: verify database connectivity."""
    from sqlalchemy import text

    try:
        async with AsyncSessionFactory() as session:
            await session.execute(text("SELECT 1"))
            return True
    except Exception:
        return False
