import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from core.redis import get_redis


async def main():
    redis = await get_redis()
    await redis.delete("login:lockout:admin@agencyos.io")
    await redis.delete("login:attempts:admin@agencyos.io")
    print("Unlocked user.")

if __name__ == "__main__":
    asyncio.run(main())
