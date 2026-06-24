import asyncio

from core.redis import get_redis


async def clear():
    redis = await get_redis()
    await redis.flushall()

asyncio.run(clear())
