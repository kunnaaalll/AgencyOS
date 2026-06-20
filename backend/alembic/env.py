"""
AgencyOS V2 — Alembic Migration Environment
Supports async SQLAlchemy engine.
"""

import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Import all models to register them with metadata
from core.database import Base
from domain.client.models import Client  # noqa: F401
from domain.crm.models import Activity, Meeting, Opportunity  # noqa: F401
from domain.discovery.models import DiscoveryJob  # noqa: F401
from domain.documents.models import CredentialRecord, Document  # noqa: F401
from domain.finance.models import (  # noqa: F401
    Distribution,
    Expense,
    FinanceSettings,
    Founder,
    Revenue,
)
from domain.knowledge.models import KnowledgeArticle, KnowledgeCategory  # noqa: F401
from domain.lead.models import Lead, LeadAnalysis  # noqa: F401
from domain.organization.models import Organization  # noqa: F401
from domain.project.models import Project  # noqa: F401
from domain.role.models import Role  # noqa: F401
from domain.task.models import Task  # noqa: F401
from domain.user.models import User  # noqa: F401

from domain.automation.models import WorkflowExecution  # noqa: F401
from domain.audit.models import AuditLog  # noqa: F401
from domain.notifications.models import Notification  # noqa: F401
from domain.backup.models import BackupRecord  # noqa: F401

# Alembic Config object
config = context.config

# Set up logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Inject DATABASE_URL from environment
from core.config import settings  # noqa: E402

config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (no DB connection needed)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations against async engine."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
