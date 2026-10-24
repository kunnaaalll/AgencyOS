from typing import Any
from uuid import UUID

from arq import create_pool
from arq.connections import RedisSettings
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import require_permission
from core.config import settings
from core.database import get_db
from domain.analysis.models import WebsiteAnalysis
from domain.analysis.schemas import WebsiteAnalysisResponse
from domain.lead.models import Lead

router = APIRouter(prefix="/analysis", tags=["Analysis"])


async def get_redis_pool():
    return await create_pool(
        RedisSettings(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD,
            database=0,
        )
    )


from fastapi import Request


@router.post("/run/{lead_id}", status_code=status.HTTP_202_ACCEPTED)
async def run_website_analysis(
    request: Request,
    lead_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("analysis:create")),
) -> dict[str, Any]:
    """Enqueue a background job to analyze the website of a given lead, preventing duplicate spamming."""
    # Check if lead exists
    lead = await db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    if not lead.website:
        raise HTTPException(status_code=400, detail="Lead does not have a website to analyze")

    # Enqueue job
    redis_pool = getattr(request.app.state, "redis", None)
    if not redis_pool:
        return {"message": "Redis is currently unavailable. Job could not be enqueued."}

    # Check if already running in background
    is_running = await redis_pool.get(f"analysis:running:{lead_id}")
    if is_running:
        return {
            "message": "Website audit is already actively running for this lead.",
            "status": "IN_PROGRESS",
            "is_running": True,
        }

    # Set 5-minute Redis lock
    await redis_pool.set(f"analysis:running:{lead_id}", "1", ex=300)
    await redis_pool.enqueue_job("analyze_website_job", str(lead_id), lead.website)

    return {
        "message": "Website analysis job enqueued successfully",
        "status": "IN_PROGRESS",
        "is_running": True,
    }


@router.get("/status/{lead_id}")
async def get_analysis_status(
    request: Request,
    lead_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("analysis:read")),
) -> dict[str, Any]:
    """Check if an analysis is in progress, pending, or completed for a lead."""
    # Check if already completed in database
    result = await db.execute(
        select(WebsiteAnalysis.id).where(WebsiteAnalysis.lead_id == lead_id)
    )
    if result.scalar_one_or_none():
        return {"status": "COMPLETED", "is_running": False}

    redis_pool = getattr(request.app.state, "redis", None)
    is_running = False
    if redis_pool:
        is_running = bool(await redis_pool.get(f"analysis:running:{lead_id}"))

    return {
        "status": "IN_PROGRESS" if is_running else "PENDING",
        "is_running": is_running,
    }


@router.get("/{lead_id}", response_model=WebsiteAnalysisResponse)
async def get_website_analysis(
    lead_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("analysis:read")),
) -> Any:
    """Get website analysis results for a specific lead."""
    result = await db.execute(
        select(WebsiteAnalysis, Lead.business_name)
        .outerjoin(Lead, WebsiteAnalysis.lead_id == Lead.id)
        .where(WebsiteAnalysis.lead_id == lead_id)
    )
    row = result.first()

    if not row:
        raise HTTPException(status_code=404, detail="Analysis not found for this lead")

    analysis, business_name = row
    resp = WebsiteAnalysisResponse.model_validate(analysis)
    resp.business_name = business_name
    return resp


@router.get("", response_model=list[WebsiteAnalysisResponse])
async def list_analyses(
    db: AsyncSession = Depends(get_db), _=Depends(require_permission("analysis:read"))
) -> Any:
    """List all website analyses with their business names."""
    result = await db.execute(
        select(WebsiteAnalysis, Lead.business_name)
        .outerjoin(Lead, WebsiteAnalysis.lead_id == Lead.id)
        .order_by(WebsiteAnalysis.analyzed_at.desc())
    )
    rows = result.all()
    output = []
    for analysis, business_name in rows:
        resp = WebsiteAnalysisResponse.model_validate(analysis)
        resp.business_name = business_name
        output.append(resp)
    return output

