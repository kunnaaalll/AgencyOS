import asyncio
import os
import random
import sys
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from datetime import UTC, datetime, timedelta

from passlib.context import CryptContext
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from core.config import settings
from domain.client.models import Client
from domain.crm.enums import PipelineStage
from domain.crm.models import Opportunity
from domain.finance.models import Expense, Revenue
from domain.lead.models import Lead

# Import models
from domain.user.models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


async def seed_demo_data():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        print("Truncating tables...")
        # Be careful, this truncates all major tables!
        tables = [
            "activities",
            "meetings",
            "opportunities",
            "leads",
            "projects",
            "clients",
            "expenses",
            "revenues",
        ]
        for table in tables:
            await db.execute(text(f"TRUNCATE TABLE {table} CASCADE;"))
        await db.commit()

        print("Querying existing user...")
        from sqlalchemy import select

        result = await db.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        if not user:
            print("No users found in database! Please run standard init first.")
            return
        user_id = user.id

        print("Creating Leads...")
        lead_ids = []
        for i in range(1, 11):
            lid = uuid.uuid4()
            lead = Lead(
                id=lid,
                business_name=f"Demo Corp {i}",
                email=f"john{i}@democorp.com",
                status="NEW",
                score=random.randint(40, 95),
            )
            db.add(lead)
            lead_ids.append(lid)
        await db.commit()

        print("Creating Opportunities...")
        now = datetime.now(UTC)
        opp_stages = [
            PipelineStage.NEW,
            PipelineStage.QUALIFIED,
            PipelineStage.PROPOSAL,
            PipelineStage.WON,
            PipelineStage.LOST,
        ]
        for i, lid in enumerate(lead_ids):
            opp = Opportunity(
                id=uuid.uuid4(),
                lead_id=lid,
                title=f"Website Redesign - Demo Corp {i + 1}",
                pipeline_stage=random.choice(opp_stages),
                value=random.randint(5000, 50000),
                probability=random.randint(10, 90),
                owner_id=user_id,
                expected_close_date=now + timedelta(days=random.randint(5, 60)),
            )
            db.add(opp)
        await db.commit()

        print("Creating Clients and Projects...")
        client_ids = []
        for i in range(1, 6):
            cid = uuid.uuid4()
            client = Client(
                id=cid,
                business_name=f"Client Company {i}",
                primary_contact_name=f"Jane Doe {i}",
                primary_contact_email=f"jane{i}@client.com",
                status="ACTIVE",
                monthly_retainer=random.choice([0, 1000, 2500, 5000]),
            )
            db.add(client)
            client_ids.append(cid)
        await db.commit()

        print("Creating Finance Records...")
        for i in range(15):
            rev = Revenue(
                id=uuid.uuid4(),
                amount=random.randint(1000, 15000),
                received_date=now - timedelta(days=random.randint(1, 30)),
                description=f"Invoice #{1000 + i}",
                status="RECEIVED",
            )
            db.add(rev)

        for i in range(10):
            exp = Expense(
                id=uuid.uuid4(),
                amount=random.randint(100, 5000),
                expense_date=now - timedelta(days=random.randint(1, 30)),
                description=f"Software Subscription {i}",
                category="SOFTWARE",
                status="PAID",
            )
            db.add(exp)
        await db.commit()

        print("Demo data seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed_demo_data())
