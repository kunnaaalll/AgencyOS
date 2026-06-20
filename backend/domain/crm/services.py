import uuid
from collections.abc import Sequence

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from domain.crm.enums import PipelineStage
from domain.crm.events import (
    MeetingScheduledEvent,
    OpportunityCreatedEvent,
    OpportunityLostEvent,
    OpportunityStageChangedEvent,
    OpportunityWonEvent,
)
from domain.crm.models import Activity, Meeting, Opportunity
from domain.crm.schemas import (
    ActivityCreate,
    ActivityUpdate,
    CRMStats,
    MeetingCreate,
    MeetingUpdate,
    OpportunityCreate,
    OpportunityUpdate,
)
from events.dispatcher import dispatch_event

PROBABILITY_MAP = {
    PipelineStage.NEW: 10,
    PipelineStage.QUALIFIED: 25,
    PipelineStage.CONTACTED: 40,
    PipelineStage.MEETING: 60,
    PipelineStage.PROPOSAL: 80,
    PipelineStage.WON: 100,
    PipelineStage.LOST: 0,
}

class CRMService:
    @staticmethod
    async def get_opportunities(db: AsyncSession) -> Sequence[Opportunity]:
        stmt = select(Opportunity).order_by(Opportunity.created_at.desc())
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_opportunity(db: AsyncSession, opp_id: uuid.UUID) -> Opportunity:
        stmt = select(Opportunity).where(Opportunity.id == opp_id)
        result = await db.execute(stmt)
        opp = result.scalar_one_or_none()
        if not opp:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found")
        return opp

    @staticmethod
    async def create_opportunity(db: AsyncSession, data: OpportunityCreate) -> Opportunity:
        probability = PROBABILITY_MAP.get(data.pipeline_stage, 10)

        opp = Opportunity(
            lead_id=data.lead_id,
            title=data.title,
            pipeline_stage=data.pipeline_stage,
            value=data.value,
            probability=probability,
            owner_id=data.owner_id,
            expected_close_date=data.expected_close_date,
            notes=data.notes,
        )
        db.add(opp)
        await db.flush()

        await dispatch_event(
            OpportunityCreatedEvent(
                opportunity_id=str(opp.id),
                lead_id=str(opp.lead_id),
                title=opp.title
            )
        )
        return opp

    @staticmethod
    async def update_opportunity(db: AsyncSession, opp_id: uuid.UUID, data: OpportunityUpdate) -> Opportunity:
        opp = await CRMService.get_opportunity(db, opp_id)

        old_stage = opp.pipeline_stage

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(opp, key, value)

        if "pipeline_stage" in update_data:
            opp.probability = PROBABILITY_MAP.get(opp.pipeline_stage, opp.probability)

        await db.flush()

        if "pipeline_stage" in update_data and old_stage != opp.pipeline_stage:
            await dispatch_event(
                OpportunityStageChangedEvent(
                    opportunity_id=str(opp.id),
                    old_stage=old_stage.value,
                    new_stage=opp.pipeline_stage.value
                )
            )
            if opp.pipeline_stage == PipelineStage.WON:
                await dispatch_event(OpportunityWonEvent(opportunity_id=str(opp.id), value=opp.value))
            elif opp.pipeline_stage == PipelineStage.LOST:
                await dispatch_event(OpportunityLostEvent(opportunity_id=str(opp.id)))

        return opp

    @staticmethod
    async def delete_opportunity(db: AsyncSession, opp_id: uuid.UUID) -> None:
        opp = await CRMService.get_opportunity(db, opp_id)
        await db.delete(opp)
        await db.flush()

    @staticmethod
    async def get_activities(db: AsyncSession, opp_id: uuid.UUID) -> Sequence[Activity]:
        stmt = select(Activity).where(Activity.opportunity_id == opp_id).order_by(Activity.created_at.desc())
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def create_activity(db: AsyncSession, opp_id: uuid.UUID, data: ActivityCreate) -> Activity:
        # verify opp exists
        await CRMService.get_opportunity(db, opp_id)

        activity = Activity(
            opportunity_id=opp_id,
            user_id=data.user_id,
            activity_type=data.activity_type,
            title=data.title,
            description=data.description,
            scheduled_for=data.scheduled_for,
            completed_at=data.completed_at
        )
        db.add(activity)
        await db.flush()
        return activity

    @staticmethod
    async def update_activity(db: AsyncSession, act_id: uuid.UUID, data: ActivityUpdate) -> Activity:
        stmt = select(Activity).where(Activity.id == act_id)
        result = await db.execute(stmt)
        activity = result.scalar_one_or_none()
        if not activity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(activity, key, value)

        await db.flush()
        return activity

    @staticmethod
    async def delete_activity(db: AsyncSession, act_id: uuid.UUID) -> None:
        stmt = select(Activity).where(Activity.id == act_id)
        result = await db.execute(stmt)
        activity = result.scalar_one_or_none()
        if not activity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
        await db.delete(activity)
        await db.flush()

    @staticmethod
    async def get_meetings(db: AsyncSession, opp_id: uuid.UUID) -> Sequence[Meeting]:
        stmt = select(Meeting).where(Meeting.opportunity_id == opp_id).order_by(Meeting.scheduled_at.asc())
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def create_meeting(db: AsyncSession, opp_id: uuid.UUID, data: MeetingCreate) -> Meeting:
        await CRMService.get_opportunity(db, opp_id)

        meeting = Meeting(
            opportunity_id=opp_id,
            meeting_type=data.meeting_type,
            scheduled_at=data.scheduled_at,
            duration_minutes=data.duration_minutes,
            location=data.location,
            meeting_notes=data.meeting_notes,
            outcome=data.outcome
        )
        db.add(meeting)
        await db.flush()

        await dispatch_event(MeetingScheduledEvent(meeting_id=str(meeting.id), opportunity_id=str(opp_id)))

        return meeting

    @staticmethod
    async def update_meeting(db: AsyncSession, meeting_id: uuid.UUID, data: MeetingUpdate) -> Meeting:
        stmt = select(Meeting).where(Meeting.id == meeting_id)
        result = await db.execute(stmt)
        meeting = result.scalar_one_or_none()
        if not meeting:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(meeting, key, value)

        await db.flush()
        return meeting

    @staticmethod
    async def delete_meeting(db: AsyncSession, meeting_id: uuid.UUID) -> None:
        stmt = select(Meeting).where(Meeting.id == meeting_id)
        result = await db.execute(stmt)
        meeting = result.scalar_one_or_none()
        if not meeting:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
        await db.delete(meeting)
        await db.flush()

    @staticmethod
    async def get_stats(db: AsyncSession) -> CRMStats:
        stmt = select(Opportunity)
        result = await db.execute(stmt)
        opps = result.scalars().all()

        pipeline_value = sum(o.value for o in opps if o.pipeline_stage not in [PipelineStage.WON, PipelineStage.LOST])
        weighted_pipeline_value = sum(int(o.value * (o.probability / 100.0)) for o in opps if o.pipeline_stage not in [PipelineStage.WON, PipelineStage.LOST])

        won = sum(1 for o in opps if o.pipeline_stage == PipelineStage.WON)
        lost = sum(1 for o in opps if o.pipeline_stage == PipelineStage.LOST)

        total_closed = won + lost
        conversion_rate = (won / total_closed * 100) if total_closed > 0 else 0.0

        # Meetings scheduled
        # Just count all upcoming meetings
        # For simplicity, counting all meetings for now.
        # In a real scenario we might only count those > func.now()
        mtg_stmt = select(func.count(Meeting.id))
        mtg_result = await db.execute(mtg_stmt)
        meetings_scheduled = mtg_result.scalar_one() or 0

        return CRMStats(
            pipeline_value=pipeline_value,
            weighted_pipeline_value=weighted_pipeline_value,
            meetings_scheduled=meetings_scheduled,
            won_opportunities=won,
            lost_opportunities=lost,
            conversion_rate=round(conversion_rate, 2)
        )
