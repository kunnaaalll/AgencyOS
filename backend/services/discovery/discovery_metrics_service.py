"""
Discovery Metrics Service — Aggregates pipeline metrics for dashboards.

Queries the database to produce:
  - Daily discovery counts (last N days)
  - Validation success rate
  - Duplicate rate
  - Promotion rate
  - Top industries and locations
  - Per-source statistics
  - Businesses per hour throughput
"""

from datetime import UTC, datetime, timedelta

import structlog
from sqlalchemy import Date, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from domain.discovery.models import DiscoveryRun, RawBusiness
from domain.discovery.schemas import (
    DailyDiscoveryCount,
    DiscoveryMetricsResponse,
    SourceStat,
    TopItem,
)

logger = structlog.get_logger()


class DiscoveryMetricsService:
    """Aggregated metrics across the discovery pipeline."""

    @staticmethod
    async def get_metrics(session: AsyncSession, days: int = 30) -> DiscoveryMetricsResponse:
        """Compute all metrics in parallel queries."""
        now = datetime.now(UTC)
        since = now - timedelta(days=days)

        # Total counts
        total_q = await session.execute(
            select(func.count(RawBusiness.id))
        )
        total_discovered = total_q.scalar() or 0

        valid_q = await session.execute(
            select(func.count(RawBusiness.id)).where(
                RawBusiness.validation_status == "VALID"
            )
        )
        total_validated = valid_q.scalar() or 0

        dup_q = await session.execute(
            select(func.count(RawBusiness.id)).where(RawBusiness.is_duplicate.is_(True))
        )
        total_duplicates = dup_q.scalar() or 0

        # Promotion rate: businesses that became leads (promoted = VALID + enriched)
        promoted_q = await session.execute(
            select(func.count(RawBusiness.id)).where(
                RawBusiness.validation_status == "VALID",
                RawBusiness.enriched_at.isnot(None),
            )
        )
        total_promoted = promoted_q.scalar() or 0

        # Rates
        validation_success_rate = (
            round((total_validated / total_discovered) * 100, 1) if total_discovered > 0 else 0.0
        )
        duplicate_rate = (
            round((total_duplicates / total_discovered) * 100, 1) if total_discovered > 0 else 0.0
        )
        promotion_rate = (
            round((total_promoted / max(total_validated, 1)) * 100, 1)
        )

        # Businesses per hour (last 24h)
        last_24h = now - timedelta(hours=24)
        recent_q = await session.execute(
            select(func.count(RawBusiness.id)).where(
                RawBusiness.created_at >= last_24h
            )
        )
        recent_count = recent_q.scalar() or 0
        businesses_per_hour = round(recent_count / 24, 1)

        # Daily counts
        daily_counts = await DiscoveryMetricsService.get_daily_counts(session, days)

        # Top industries
        top_industries = await DiscoveryMetricsService.get_top_industries(session)

        # Top locations
        top_locations = await DiscoveryMetricsService.get_top_locations(session)

        # Source stats
        source_stats = await DiscoveryMetricsService.get_source_stats(session)

        return DiscoveryMetricsResponse(
            total_discovered=total_discovered,
            total_validated=total_validated,
            total_promoted=total_promoted,
            validation_success_rate=validation_success_rate,
            duplicate_rate=duplicate_rate,
            promotion_rate=promotion_rate,
            businesses_per_hour=businesses_per_hour,
            daily_counts=daily_counts,
            top_industries=top_industries,
            top_locations=top_locations,
            source_stats=source_stats,
        )

    @staticmethod
    async def get_daily_counts(
        session: AsyncSession, days: int = 30
    ) -> list[DailyDiscoveryCount]:
        """Return daily discovery counts for the last N days."""
        since = datetime.now(UTC) - timedelta(days=days)

        result = await session.execute(
            select(
                cast(RawBusiness.created_at, Date).label("date"),
                func.count(RawBusiness.id).label("count"),
            )
            .where(RawBusiness.created_at >= since)
            .group_by(cast(RawBusiness.created_at, Date))
            .order_by(cast(RawBusiness.created_at, Date))
        )

        rows = result.all()
        return [
            DailyDiscoveryCount(date=str(row.date), count=row.count)
            for row in rows
        ]

    @staticmethod
    async def get_top_industries(
        session: AsyncSession, limit: int = 10
    ) -> list[TopItem]:
        """Return top industries by number of discovered businesses."""
        result = await session.execute(
            select(
                RawBusiness.industry,
                func.count(RawBusiness.id).label("count"),
            )
            .where(RawBusiness.industry.isnot(None))
            .group_by(RawBusiness.industry)
            .order_by(func.count(RawBusiness.id).desc())
            .limit(limit)
        )
        return [TopItem(name=row.industry, count=row.count) for row in result.all()]

    @staticmethod
    async def get_top_locations(
        session: AsyncSession, limit: int = 10
    ) -> list[TopItem]:
        """Return top cities by number of discovered businesses."""
        result = await session.execute(
            select(
                RawBusiness.city,
                func.count(RawBusiness.id).label("count"),
            )
            .where(RawBusiness.city.isnot(None))
            .group_by(RawBusiness.city)
            .order_by(func.count(RawBusiness.id).desc())
            .limit(limit)
        )
        return [TopItem(name=row.city, count=row.count) for row in result.all()]

    @staticmethod
    async def get_source_stats(session: AsyncSession) -> list[SourceStat]:
        """Return per-source statistics."""
        # Totals per source
        totals_q = await session.execute(
            select(
                RawBusiness.source,
                func.count(RawBusiness.id).label("total"),
                func.sum(
                    func.cast(RawBusiness.validation_status == "VALID", type_=func.count().type)
                ).label("valid"),
                func.sum(
                    func.cast(RawBusiness.is_duplicate.is_(True), type_=func.count().type)
                ).label("duplicates"),
            )
            .group_by(RawBusiness.source)
        )

        # Runtime from DiscoveryRun
        runtime_q = await session.execute(
            select(
                DiscoveryRun.source,
                func.avg(
                    func.extract(
                        "epoch",
                        DiscoveryRun.completed_at - DiscoveryRun.started_at,
                    )
                ).label("avg_runtime"),
            )
            .where(
                DiscoveryRun.status == "COMPLETED",
                DiscoveryRun.completed_at.isnot(None),
                DiscoveryRun.started_at.isnot(None),
            )
            .group_by(DiscoveryRun.source)
        )

        runtime_map: dict[str, float] = {
            row.source: round(row.avg_runtime or 0, 1) for row in runtime_q.all()
        }

        stats: list[SourceStat] = []
        for row in totals_q.all():
            total = row.total or 0
            valid = row.valid or 0
            duplicates = row.duplicates or 0
            invalid = total - valid

            stats.append(
                SourceStat(
                    source=row.source,
                    total=total,
                    valid=valid,
                    invalid=invalid,
                    duplicates=duplicates,
                    success_rate=round((valid / total * 100) if total > 0 else 0, 1),
                    avg_runtime_seconds=runtime_map.get(row.source, 0.0),
                )
            )

        return sorted(stats, key=lambda s: s.total, reverse=True)
