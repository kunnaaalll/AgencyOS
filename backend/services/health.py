"""
AgencyOS V2 — Health Check Service
Verifies connectivity to all external services.
"""

from dataclasses import dataclass
from enum import Enum

from core.database import check_database_connection
from core.meilisearch import check_meilisearch_connection
from core.minio import check_minio_connection
from core.redis import check_redis_connection


class ServiceStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    OFFLINE = "offline"


@dataclass
class ServiceHealth:
    name: str
    status: ServiceStatus
    latency_ms: float | None = None
    message: str | None = None


@dataclass
class SystemHealth:
    status: ServiceStatus  # Overall status
    services: list[ServiceHealth]

    @property
    def is_healthy(self) -> bool:
        return self.status == ServiceStatus.HEALTHY


async def check_all_services() -> SystemHealth:
    """
    Run health checks for all external services concurrently.
    Returns overall system health with per-service details.
    """
    import asyncio
    import time

    async def check_service(name: str, check_fn) -> ServiceHealth:
        start = time.monotonic()
        try:
            is_healthy = await check_fn()
            latency_ms = (time.monotonic() - start) * 1000
            return ServiceHealth(
                name=name,
                status=ServiceStatus.HEALTHY if is_healthy else ServiceStatus.OFFLINE,
                latency_ms=round(latency_ms, 2),
            )
        except Exception as e:
            latency_ms = (time.monotonic() - start) * 1000
            return ServiceHealth(
                name=name,
                status=ServiceStatus.OFFLINE,
                latency_ms=round(latency_ms, 2),
                message=str(e)[:200],
            )

    async def check_backend():
        return True

    results = await asyncio.gather(
        check_service("backend", check_backend),  # Always healthy if we're running
        check_service("postgresql", check_database_connection),
        check_service("redis", check_redis_connection),
        check_service("minio", check_minio_connection),
        check_service("meilisearch", check_meilisearch_connection),
    )

    all_healthy = all(s.status == ServiceStatus.HEALTHY for s in results)
    any_offline = any(s.status == ServiceStatus.OFFLINE for s in results)

    if all_healthy:
        overall = ServiceStatus.HEALTHY
    elif any_offline:
        overall = ServiceStatus.DEGRADED
    else:
        overall = ServiceStatus.DEGRADED

    return SystemHealth(status=overall, services=list(results))
