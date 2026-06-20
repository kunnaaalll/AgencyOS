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
from workers.jobs.analysis import analyze_website_job
from workers.jobs.qualification_ai import qualify_lead_job
from workers.jobs.outreach import generate_outreach_job

import structlog

logger = structlog.get_logger()

async def startup(ctx):
    logger.info("Worker starting up...")

async def shutdown(ctx):
    logger.info("Worker shutting down...")

async def dummy_task(ctx: dict) -> None:
    pass

FUNCTIONS: list = [
    dummy_task,
    discover_businesses,
    validate_business,
    enrich_business,
    analyze_website_job,
    qualify_lead_job,
    generate_outreach_job,
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
