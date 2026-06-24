import asyncio
import os
import sys

sys.path.append(os.getcwd())

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from core.database import Base
from domain.analytics.services import AnalyticsService
from domain.finance.services import FinanceService


async def test():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as db:
        print("Testing FinanceSummary...")
        try:
            res = await FinanceService.get_summary(db)
            print("FinanceSummary OK:", res)
        except Exception as e:
            print("FinanceSummary ERROR:", type(e), e)

        print("\nTesting ExecutiveSummary (Analytics)...")
        try:
            res = await AnalyticsService.get_executive_summary(db)
            print("ExecutiveSummary OK:", res)
        except Exception as e:
            print("ExecutiveSummary ERROR:", type(e), e)


if __name__ == "__main__":
    asyncio.run(test())
