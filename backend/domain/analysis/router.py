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
    return await create_pool(RedisSettings(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        password=settings.REDIS_PASSWORD,
        database=0
    ))


from fastapi import Request


@router.post("/run/{lead_id}", status_code=status.HTTP_202_ACCEPTED)
async def run_website_analysis(
    request: Request,
    lead_id: UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_permission("analysis:create"))
) -> dict[str, str]:
    """Enqueue a background job to analyze the website of a given lead."""
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

    await redis_pool.enqueue_job("analyze_website_job", str(lead_id), lead.website)

    return {"message": "Website analysis job enqueued successfully"}


@router.get("/{lead_id}", response_model=WebsiteAnalysisResponse)
async def get_website_analysis(
    lead_id: UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_permission("analysis:read"))
) -> Any:
    """Get website analysis results for a specific lead."""
    result = await db.execute(
        select(WebsiteAnalysis).where(WebsiteAnalysis.lead_id == lead_id)
    )
    analysis = result.scalar_one_or_none()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found for this lead")

    return analysis


@router.get("", response_model=list[WebsiteAnalysisResponse])
async def list_analyses(
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_permission("analysis:read"))
) -> Any:
    """List all website analyses."""
    result = await db.execute(select(WebsiteAnalysis).order_by(WebsiteAnalysis.analyzed_at.desc()))
    return result.scalars().all()
