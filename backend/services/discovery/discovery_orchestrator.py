"""
Discovery Orchestrator — Central coordinator for bulk discovery operations.

Responsibilities:
  - Generate the full query matrix (industry × location × source)
  - Launch ARQ jobs for each combination
  - Track progress via DiscoveryBulkJob model
  - Support retrying failed queries
"""

import asyncio
import uuid

import structlog
from arq.connections import ArqRedis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from domain.discovery.models import DiscoveryBulkJob
from domain.discovery.sources import ALL_SOURCES

logger = structlog.get_logger()


# ── Catalogs ──────────────────────────────────────────────────────────────────

INDUSTRIES = [
    "dentist",
    "restaurant",
    "salon",
    "spa",
    "skin clinic",
    "gym",
    "interior designer",
    "architect",
    "lawyer",
    "CA",
    "real estate agent",
    "school",
    "coaching class",
    "hospital",
    "bakery",
    "cafe",
    "hotel",
    "jeweller",
    "furniture store",
    "digital marketing agency",
]

MUMBAI_LOCATIONS = [
    "Andheri",
    "Borivali",
    "Bandra",
    "Malad",
    "Kandivali",
    "Goregaon",
    "Powai",
    "Dadar",
    "Chembur",
    "Thane",
    "Navi Mumbai",
]


class DiscoveryOrchestrator:
    """
    Coordinates large-scale bulk discovery across all sources and query combinations.
    """

    @staticmethod
    def generate_query_matrix(
        industries: list[str],
        locations: list[str],
    ):
        """
        Generate all (industry, location) query combinations.
        Yields: (industry, location)
        """
        for industry in industries:
            for location in locations:
                yield (industry, location)

    @staticmethod
    async def launch_bulk_discovery(
        session: AsyncSession,
        redis: ArqRedis,
        industries: list[str],
        locations: list[str],
        sources: list[str],
        limit_per_query: int = 10,
    ) -> DiscoveryBulkJob:
        """
        Create a DiscoveryBulkJob and enqueue all discovery jobs.
        """
        # Validate sources
        valid_sources = [s for s in sources if s in ALL_SOURCES]
        if not valid_sources:
            valid_sources = ["google_maps", "google_search"]

        # Calculate total queries
        total = len(industries) * len(locations) * len(valid_sources)

        bulk_job = DiscoveryBulkJob(
            industries=industries,
            locations=locations,
            sources=valid_sources,
            limit_per_query=limit_per_query,
            status="RUNNING",
            total_queries=total,
            completed_queries=0,
            failed_queries=0,
            businesses_discovered=0,
        )
        session.add(bulk_job)
        await session.commit()
        await session.refresh(bulk_job)

        logger.info(
            "Bulk discovery launched",
            bulk_job_id=str(bulk_job.id),
            industries=len(industries),
            locations=len(locations),
            sources=len(valid_sources),
            total_queries=total,
        )

        # Enqueue the orchestration job if Redis is available
        if redis:
            try:
                await redis.enqueue_job(
                    "bulk_discovery_job",
                    str(bulk_job.id),
                )
            except Exception as e:
                logger.error("Failed to enqueue bulk_discovery_job", error=str(e), bulk_job_id=str(bulk_job.id))
        else:
            logger.warning("redis_unavailable", action="skipping enqueue of bulk_discovery_job")

        return bulk_job

    @staticmethod
    async def distribute_queries(
        redis: ArqRedis,
        bulk_job_id: str,
        industries: list[str],
        locations: list[str],
        sources: list[str],
        limit_per_query: int,
    ) -> None:
        """
        Enqueue individual discovery run jobs for each query combination.
        Called by bulk_discovery_job worker.
        """
        from core.database import AsyncSessionFactory
        from domain.discovery.models import DiscoveryRun

        async with AsyncSessionFactory() as session:
            query_pairs = list(DiscoveryOrchestrator.generate_query_matrix(industries, locations))

            for source in sources:
                for industry, location in query_pairs:
                    try:
                        # Create a DiscoveryRun for attribution
                        run = DiscoveryRun(
                            source=source,
                            query=industry,
                            location=location,
                            status="PENDING",
                        )
                        session.add(run)
                        await session.flush()

                        # Enqueue with bulk_job_id for tracking
                        await redis.enqueue_job(
                            "discover_businesses",
                            str(run.id),
                            limit_per_query,
                            bulk_job_id,
                        )

                        # Small delay between enqueueing to avoid Redis overflow
                        await asyncio.sleep(0.05)

                    except Exception as e:
                        logger.warning(
                            "Failed to enqueue query",
                            source=source,
                            industry=industry,
                            location=location,
                            error=str(e),
                        )

            await session.commit()
            logger.info(
                "All queries enqueued",
                bulk_job_id=bulk_job_id,
                count=len(query_pairs) * len(sources),
            )

    @staticmethod
    async def update_bulk_progress(
        session: AsyncSession,
        bulk_job_id: str,
        completed_delta: int = 0,
        failed_delta: int = 0,
        discovered_delta: int = 0,
    ) -> None:
        """Atomically update bulk job progress counters."""
        res = await session.execute(
            select(DiscoveryBulkJob).where(DiscoveryBulkJob.id == uuid.UUID(bulk_job_id))
        )
        job = res.scalar_one_or_none()
        if not job:
            return

        job.completed_queries += completed_delta
        job.failed_queries += failed_delta
        job.businesses_discovered += discovered_delta

        # Check if all queries done
        total_done = job.completed_queries + job.failed_queries
        if total_done >= job.total_queries:
            job.status = "COMPLETED"
            logger.info("Bulk discovery job completed", bulk_job_id=bulk_job_id)

        await session.commit()
