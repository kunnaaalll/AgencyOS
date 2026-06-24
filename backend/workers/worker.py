"""
AgencyOS V2.1 — ARQ Worker Configuration

Phase 9.1: Enterprise Discovery Pipeline
"""

import structlog
from arq.connections import RedisSettings as ArqRedisSettings

from core.config import settings
from utils.browser_pool import initialize_browser_pool, shutdown_browser_pool
from workers.jobs.analysis import analyze_website_job
from workers.jobs.discovery import (
    bulk_discovery_job,
    discover_businesses,
    enrich_business,
    validate_business,
)
from workers.jobs.outreach import generate_outreach_job
from workers.jobs.qualification_ai import qualify_lead_job

logger = structlog.get_logger()


async def startup(ctx: dict):
    logger.info("Worker starting up — initializing BrowserPool...")
    await initialize_browser_pool()
    logger.info("BrowserPool ready")


async def shutdown(ctx: dict):
    logger.info("Worker shutting down — closing BrowserPool...")
    await shutdown_browser_pool()
    logger.info("BrowserPool closed")


async def dummy_task(ctx: dict) -> None:
    pass


FUNCTIONS: list = [
    dummy_task,
    # Discovery pipeline
    discover_businesses,
    validate_business,
    enrich_business,
    bulk_discovery_job,
    # Other pipelines
    analyze_website_job,
    qualify_lead_job,
    generate_outreach_job,
]


class WorkerSettings:
    """
    ARQ worker configuration.
    Usage: arq workers.worker.WorkerSettings
    """

    functions = FUNCTIONS

    redis_settings = ArqRedisSettings(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        password=settings.REDIS_PASSWORD,
        database=0,
    )

    # Job timeouts
    job_timeout = 600  # 10 minutes (extended for bulk discovery)
    keep_result = 3600  # Keep results for 1 hour
    max_tries = 3  # Retry failed jobs up to 3 times
    retry_jobs = True

    # Startup / shutdown hooks (BrowserPool lifecycle)
    on_startup = startup
    on_shutdown = shutdown
