"""
AgencyOS V2 — ARQ Worker Configuration

Phase 1: Worker infrastructure stub.
Jobs will be registered here in future phases.

Usage:
  arq workers.worker.WorkerSettings
"""

from arq.connections import RedisSettings as ArqRedisSettings

from core.config import settings

# ── Task Registry ─────────────────────────────────────────────
# Future tasks will be imported and registered here:
# from workers.tasks.email import send_email_task
# from workers.tasks.enrichment import enrich_contact_task

from workers.jobs.discovery import discover_businesses, validate_business, enrich_business

async def dummy_task(ctx: dict) -> None:
    pass

FUNCTIONS: list = [
    dummy_task,
    discover_businesses,
    validate_business,
    enrich_business,
]


# ── ARQ Worker Settings ───────────────────────────────────────
class WorkerSettings:
    """
    ARQ worker configuration class.
    ARQ discovers this class by convention.
    """

    functions = FUNCTIONS

    redis_settings = ArqRedisSettings(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        password=settings.REDIS_PASSWORD,
        database=0,
    )

    # Job timeout defaults
    job_timeout = 300          # 5 minutes
    keep_result = 3600         # Keep results for 1 hour
    max_tries = 3              # Retry failed jobs up to 3 times
    retry_jobs = True

    # Startup / shutdown hooks
    on_startup = None
    on_shutdown = None
