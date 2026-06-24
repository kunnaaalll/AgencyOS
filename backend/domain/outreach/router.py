from typing import Any

from arq import create_pool
from arq.connections import RedisSettings
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import require_permission
from core.config import settings
from core.database import get_db
from domain.lead.models import Lead
from domain.outreach.enums import DraftStatus, OutreachChannel
from domain.outreach.models import OutreachDraft
from domain.outreach.schemas import OutreachDraftResponse, OutreachDraftUpdate
from events.bus import EventBus

router = APIRouter(prefix="/outreach", tags=["Outreach"])


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


@router.post("/generate/{lead_id}", status_code=status.HTTP_202_ACCEPTED)
async def generate_outreach(
    request: Request,
    lead_id: str,
    channel: OutreachChannel,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("outreach:create")),
) -> dict[str, str]:
    """Enqueue a background job to run AI outreach generation for a given lead."""
    # Check if lead exists
    lead = await db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Enqueue job
    redis_pool = getattr(request.app.state, "redis", None)
    if not redis_pool:
        # Graceful fallback if Redis is down
        return {"message": "Redis is currently unavailable. Job could not be enqueued."}

    await redis_pool.enqueue_job("generate_outreach_job", str(lead_id), channel.value)

    return {
        "message": f"AI outreach generation job for channel {channel.value} enqueued successfully"
    }


from sqlalchemy.orm import joinedload


@router.get("/{draft_id}", response_model=OutreachDraftResponse)
async def get_outreach_draft(
    draft_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("outreach:read")),
) -> Any:
    """Get outreach draft by ID."""
    result = await db.execute(
        select(OutreachDraft)
        .options(joinedload(OutreachDraft.lead))
        .where(OutreachDraft.id == draft_id)
    )
    draft = result.scalars().first()
    if not draft:
        raise HTTPException(status_code=404, detail="Outreach draft not found")
    return draft


@router.get("", response_model=list[OutreachDraftResponse])
async def list_outreach_drafts(
    db: AsyncSession = Depends(get_db), _=Depends(require_permission("outreach:read"))
) -> Any:
    """List all outreach drafts."""
    result = await db.execute(
        select(OutreachDraft)
        .options(joinedload(OutreachDraft.lead))
        .order_by(OutreachDraft.created_at.desc())
    )
    return result.scalars().all()


@router.patch("/{draft_id}", response_model=OutreachDraftResponse)
async def update_outreach_draft(
    draft_id: str,
    update_data: OutreachDraftUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("outreach:update")),
) -> Any:
    """Update an outreach draft (Edit, Approve, Reject, Mark Used)."""
    result = await db.execute(
        select(OutreachDraft)
        .options(joinedload(OutreachDraft.lead))
        .where(OutreachDraft.id == draft_id)
    )
    draft = result.scalars().first()
    if not draft:
        raise HTTPException(status_code=404, detail="Outreach draft not found")

    update_dict = update_data.model_dump(exclude_unset=True)

    status_changed_to_approved = False
    if (
        "status" in update_dict
        and update_dict["status"] == DraftStatus.APPROVED
        and draft.status != DraftStatus.APPROVED
    ):
        status_changed_to_approved = True

    for key, value in update_dict.items():
        setattr(draft, key, value)

    await db.commit()
    await db.refresh(draft)

    if status_changed_to_approved:
        # Emit event
        await EventBus.publish(
            {
                "type": "OutreachDraftApproved",
                "lead_id": draft.lead_id,
                "draft_id": draft.id,
                "channel": draft.channel.value,
            }
        )

    return draft
