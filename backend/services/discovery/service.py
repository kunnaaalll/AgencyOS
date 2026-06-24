from arq.connections import ArqRedis
from sqlalchemy.ext.asyncio import AsyncSession

from domain.discovery.models import DiscoveryRun
from domain.discovery.schemas import DiscoveryRunCreate


class DiscoveryService:
    @staticmethod
    async def create_discovery_run(
        db: AsyncSession,
        redis: ArqRedis,
        run_in: DiscoveryRunCreate
    ) -> DiscoveryRun:
        run = DiscoveryRun(
            source=run_in.source,
            query=run_in.query,
            location=run_in.location,
            status="PENDING"
        )
        db.add(run)
        await db.commit()
        await db.refresh(run)

        # Enqueue the background job
        await redis.enqueue_job("discover_businesses", str(run.id), run_in.limit)

        return run
