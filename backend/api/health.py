"""
AgencyOS V2 — Health Router
GET /api/health
"""

from fastapi import APIRouter
from fastapi.responses import ORJSONResponse

from services.health import ServiceStatus, check_all_services

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    summary="System health check",
    description="Returns connectivity status for all services (PostgreSQL, Redis, MinIO, Meilisearch).",
    response_class=ORJSONResponse,
)
async def health_check() -> ORJSONResponse:
    health = await check_all_services()

    response_body = {
        "status": health.status.value,
        "services": [
            {
                "name": s.name,
                "status": s.status.value,
                "latency_ms": s.latency_ms,
                **({"message": s.message} if s.message else {}),
            }
            for s in health.services
        ],
    }

    # Return 200 for healthy/degraded, 503 for full offline
    status_code = 200 if health.status != ServiceStatus.OFFLINE else 503
    return ORJSONResponse(content=response_body, status_code=status_code)
