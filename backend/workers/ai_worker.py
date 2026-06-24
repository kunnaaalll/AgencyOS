"""
AgencyOS V2.1 — AI Worker Engine

This worker handles lightweight AI and API-based tasks without initializing the BrowserPool.
"""

import structlog
from arq.connections import RedisSettings as ArqRedisSettings

from core.config import settings
from core.queue_names import QUEUE_AI
from workers.jobs.outreach import generate_outreach_job
from workers.jobs.qualification_ai import qualify_lead_job

logger = structlog.get_logger()


async def startup(ctx: dict):
    logger.info("AI Worker starting up...")


async def shutdown(ctx: dict):
    logger.info("AI Worker shutting down...")


async def dummy_task(ctx: dict) -> None:
    pass


FUNCTIONS: list = [
    dummy_task,
    qualify_lead_job,
    generate_outreach_job,
]


class WorkerSettings:
    """
    ARQ worker configuration for AI tasks.
    Usage: arq workers.ai_worker.WorkerSettings
    """

    queue_name = QUEUE_AI
    functions = FUNCTIONS

    redis_settings = ArqRedisSettings(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        password=settings.REDIS_PASSWORD,
        database=0,
    )

    # Job timeouts
    job_timeout = 300  # 5 minutes
    keep_result = 3600  # Keep results for 1 hour
    max_tries = 3  # Retry failed jobs up to 3 times
    retry_jobs = True

    on_startup = startup
    on_shutdown = shutdown
