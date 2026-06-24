import asyncio
import sys
import os
sys.path.append(os.getcwd())

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from domain.analytics.services import AnalyticsService
from domain.finance.services import FinanceService
from core.database import Base

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
