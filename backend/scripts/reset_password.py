import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text

from core.database import AsyncSessionFactory
from core.security import hash_password


async def main():
    async with AsyncSessionFactory() as session:
        new_hash = hash_password("change_me_superadmin_password")
        await session.execute(text("UPDATE users SET hashed_password = :hash WHERE email = 'admin@agencyos.io'"), {"hash": new_hash})
        await session.commit()
        print("Password reset successfully via raw SQL.")

if __name__ == "__main__":
    asyncio.run(main())
