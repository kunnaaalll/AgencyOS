"""
Source Rate Limiter — Redis-backed sliding window rate limiter.

Enforces a maximum of 1 request per second per source to ensure
responsible scraping practices and avoid IP bans.
"""

import asyncio
import time

import redis.asyncio as aioredis
import structlog

from core.config import settings

logger = structlog.get_logger()

# Maximum 1 request per second per source
MAX_REQUESTS_PER_SECOND = 1
WINDOW_SECONDS = 1


class SourceRateLimiter:
    """
    Redis-backed sliding window rate limiter for discovery sources.

    Ensures each source is not called more than once per second.
    Uses asyncio.sleep as a fallback if Redis is unavailable.
    """

    def __init__(self):
        self._redis: aioredis.Redis | None = None
        self._local_locks: dict[str, asyncio.Lock] = {}
        self._last_request: dict[str, float] = {}

    async def _get_redis(self) -> aioredis.Redis | None:
        if self._redis is None:
            try:
                self._redis = aioredis.from_url(
                    settings.REDIS_URL,
                    encoding="utf-8",
                    decode_responses=True,
                    socket_connect_timeout=2,
                )
                await self._redis.ping()
            except Exception:
                logger.warning("Redis unavailable for rate limiter, using local fallback")
                self._redis = None
        return self._redis

    def _get_lock(self, source: str) -> asyncio.Lock:
        if source not in self._local_locks:
            self._local_locks[source] = asyncio.Lock()
        return self._local_locks[source]

    async def acquire(self, source: str) -> None:
        """
        Acquire a rate limit token for the given source.
        Blocks until a token is available (max 1 req/sec/source).
        """
        redis = await self._get_redis()

        if redis:
            await self._acquire_redis(source, redis)
        else:
            await self._acquire_local(source)

    async def _acquire_redis(self, source: str, redis: aioredis.Redis) -> None:
        """Redis sliding window rate limiter."""
        key = f"ratelimit:{source}"
        max_retries = 50  # 5 seconds max wait

        for attempt in range(max_retries):
            now = time.time()
            window_start = now - WINDOW_SECONDS

            pipe = redis.pipeline()
            # Remove expired entries
            pipe.zremrangebyscore(key, 0, window_start)
            # Count current requests in window
            pipe.zcard(key)
            results = await pipe.execute()

            count = results[1]

            if count < MAX_REQUESTS_PER_SECOND:
                # Add current request
                await redis.zadd(key, {str(now): now})
                await redis.expire(key, 10)
                return

            # Wait and retry
            await asyncio.sleep(0.1)

        logger.warning("Rate limiter timeout exceeded", source=source)

    async def _acquire_local(self, source: str) -> None:
        """Local fallback rate limiter using asyncio locks + sleep."""
        lock = self._get_lock(source)
        async with lock:
            last = self._last_request.get(source, 0)
            now = time.time()
            elapsed = now - last

            if elapsed < WINDOW_SECONDS:
                await asyncio.sleep(WINDOW_SECONDS - elapsed)

            self._last_request[source] = time.time()

    async def is_allowed(self, source: str) -> bool:
        """Check if a request is currently allowed without blocking."""
        redis = await self._get_redis()

        if redis:
            key = f"ratelimit:{source}"
            now = time.time()
            window_start = now - WINDOW_SECONDS
            await redis.zremrangebyscore(key, 0, window_start)
            count = await redis.zcard(key)
            return count < MAX_REQUESTS_PER_SECOND
        else:
            last = self._last_request.get(source, 0)
            return (time.time() - last) >= WINDOW_SECONDS


# Module-level singleton
_rate_limiter: SourceRateLimiter | None = None


def get_rate_limiter() -> SourceRateLimiter:
    """Get or create the global SourceRateLimiter singleton."""
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = SourceRateLimiter()
    return _rate_limiter
