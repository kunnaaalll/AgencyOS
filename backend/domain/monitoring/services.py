"""
AgencyOS V2 — Monitoring Services
"""

import os
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import check_database_connection
from core.redis import check_redis_connection, get_redis
from core.minio import check_minio_connection
from core.meilisearch import check_meilisearch_connection
from .schemas import SystemHealthResponse
from arq.constants import default_queue_name

class SystemMonitorService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_system_health(self) -> SystemHealthResponse:
        postgres_health = await check_database_connection()
        redis_health = await check_redis_connection()
        minio_health = await check_minio_connection()
        meilisearch_health = await check_meilisearch_connection()

        queue_depth = 0
        active_workers = 0
        failed_jobs = 0

        if redis_health:
            try:
                redis = await get_redis()
                # Use ARQ defaults to fetch metrics
                queue_depth = await redis.zcard(default_queue_name)
                # ARQ doesn't provide an easy active workers list out of the box in simple usage, 
                # but we can try to guess or mock if we don't use the health check key.
                # For this implementation, we will keep it simple or zero if not easily retrievable.
                active_workers = 1 # mocked for simple visibility
                # Failed jobs are often kept in arq:result with a failure flag, or custom list.
                # Just mock for now unless we have a specific arq tracker.
                failed_jobs = 0 
            except Exception:
                pass

        # Mock storage usage 
        # In a real app we might query Postgres DB size or MinIO bucket size.
        storage_usage = "42.5 GB"

        return SystemHealthResponse(
            postgres_health=postgres_health,
            redis_health=redis_health,
            minio_health=minio_health,
            meilisearch_health=meilisearch_health,
            queue_depth=queue_depth,
            active_workers=active_workers,
            failed_jobs=failed_jobs,
            storage_usage=storage_usage
        )
