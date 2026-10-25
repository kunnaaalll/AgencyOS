import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user
from core.database import get_db
from domain.lead.models import Lead, LeadAnalysis
from domain.lead.schemas import (
    LeadAnalysisCreate,
    LeadAnalysisResponse,
    LeadCreate,
    LeadResponse,
    LeadStats,
    LeadUpdate,
)
from domain.user.models import User

router = APIRouter(tags=["Leads"])


@router.get("/leads", response_model=list[LeadResponse])
async def list_leads(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 5000,
    is_published: bool | None = None,
    min_score: int | None = None,
):
    if not current_user.has_permission("leads:read"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    query = select(Lead).order_by(Lead.created_at.desc())
    if is_published is not None:
        query = query.where(Lead.is_published == is_published)
    if min_score is not None:
        query = query.where(Lead.score >= min_score)

    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.post("/leads/{lead_id}/publish", response_model=LeadResponse)
async def publish_lead(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.has_permission("leads:update"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead.is_published = True
    await db.commit()
    await db.refresh(lead)
    return lead


@router.post("/leads", response_model=LeadResponse)
async def create_lead(
    lead_in: LeadCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.has_permission("leads:create"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    lead = Lead(**lead_in.model_dump())
    db.add(lead)
    await db.commit()
    await db.refresh(lead)
    return lead


@router.get("/leads/stats", response_model=LeadStats)
async def get_lead_stats(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    if not current_user.has_permission("leads:read"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    total = await db.scalar(select(func.count()).select_from(Lead))
    qualified = await db.scalar(
        select(func.count()).select_from(Lead).where(Lead.status == "QUALIFIED")
    )
    high_priority = await db.scalar(
        select(func.count()).select_from(Lead).where(Lead.priority == "HIGH")
    )

    return LeadStats(
        total_leads=total or 0,
        qualified_leads=qualified or 0,
        high_priority_leads=high_priority or 0,
    )


@router.get("/leads/{id}", response_model=LeadResponse)
async def get_lead(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.has_permission("leads:read"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    lead = await db.get(Lead, id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.patch("/leads/{id}", response_model=LeadResponse)
async def update_lead(
    id: uuid.UUID,
    lead_in: LeadUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.has_permission("leads:update"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    lead = await db.get(Lead, id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    update_data = lead_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lead, field, value)

    await db.commit()
    await db.refresh(lead)
    return lead


@router.post("/leads/{id}/auto-discover-website")
async def auto_discover_website(
    id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Automatically find and attach the official domain for a lead using web search."""
    if not current_user.has_permission("leads:update"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    lead = await db.get(Lead, id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    from urllib.parse import urlparse
    from duckduckgo_search import DDGS

    query = f"{lead.business_name} {lead.city or ''} official website"
    found_url = None
    blacklist_domains = {
        "facebook.com", "instagram.com", "linkedin.com", "twitter.com", "x.com",
        "youtube.com", "justdial.com", "indiamart.com", "practo.com", "google.com",
        "yelp.com", "tripadvisor.com", "yellowpages.com", "sulekha.com", "wikipedia.org",
    }

    try:
        with DDGS() as ddgs:
            results = ddgs.text(query, max_results=8)
            for r in results:
                href = r.get("href", "")
                if href:
                    parsed = urlparse(href)
                    domain = parsed.netloc.lower().replace("www.", "")
                    if not any(b in domain for b in blacklist_domains):
                        found_url = f"{parsed.scheme}://{parsed.netloc}"
                        break
    except Exception as e:
        pass

    if found_url:
        lead.website = found_url
        await db.commit()
        await db.refresh(lead)

        # Enqueue background analysis
        redis_pool = getattr(request.app.state, "redis", None)
        if redis_pool:
            try:
                await redis_pool.enqueue_job("analyze_website_job", str(lead.id), lead.website)
            except Exception:
                pass

        return {
            "success": True,
            "website": found_url,
            "message": f"Successfully auto-discovered website: {found_url}. Audit queued in background.",
        }

    return {
        "success": False,
        "website": None,
        "message": "Verified Offline Business: No independent website found online. High-value candidate for Website Creation Pitch.",
    }


@router.delete("/leads/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.has_permission("leads:delete"):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    lead = await db.get(Lead, id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    await db.delete(lead)
    await db.commit()


