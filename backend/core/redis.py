"""
AgencyOS V2 — Redis Connection Pool
Compatible with both direct Redis usage and ARQ worker queue.
"""

import redis.asyncio as aioredis
from redis.asyncio import ConnectionPool, Redis

from core.config import settings

_pool: ConnectionPool | None = None


def get_redis_pool() -> ConnectionPool:
    """Get or create the Redis connection pool (singleton)."""
    global _pool
    if _pool is None:
        _pool = aioredis.ConnectionPool.from_url(
            settings.REDIS_URL,
            max_connections=20,
            decode_responses=True,
        )
    return _pool


async def get_redis() -> Redis:
    """FastAPI dependency: get a Redis client from the pool."""
    pool = get_redis_pool()
    return aioredis.Redis(connection_pool=pool)


async def check_redis_connection() -> bool:
    """Health check: verify Redis connectivity."""
    try:
        client = await get_redis()
        await client.ping()
        return True
    except Exception:
        return False


# ── ARQ Redis Settings ────────────────────────────────────────
class RedisSettings:
    """ARQ-compatible Redis settings."""

    host: str = settings.REDIS_HOST
    port: int = settings.REDIS_PORT
    password: str = settings.REDIS_PASSWORD
    database: int = 0
    conn_timeout: int = 5
    conn_retries: int = 5


arq_redis_settings = RedisSettings()
