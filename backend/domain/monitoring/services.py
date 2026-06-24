"""
AgencyOS V2 — Monitoring Services
"""

import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
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
                queue_depth = await redis.zcard(default_queue_name)
                # ARQ health checks: 'arq:health-check:*'
                health_keys = await redis.keys('arq:health-check:*')
                active_workers = len(health_keys)
                failed_jobs = await redis.get('arq:metrics:failed_jobs') or 0
                failed_jobs = int(failed_jobs)
            except Exception:
                pass

        # Calculate real Postgres database size
        storage_usage = "Unknown"
        try:
            res = await self.db.execute(text("SELECT pg_size_pretty(pg_database_size(current_database()))"))
            storage_usage = res.scalar() or "0 bytes"
        except Exception as e:
            pass

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
