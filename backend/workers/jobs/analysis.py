import logging
from uuid import UUID

from core.database import AsyncSessionFactory
from domain.analysis.events import WebsiteAnalyzedEvent
from events.bus import EventBus
from services.analysis.service import WebsiteAnalysisService

logger = logging.getLogger(__name__)


async def analyze_website_job(ctx: dict, lead_id: str, website_url: str | None = None) -> None:
    logger.info(f"Starting background job: analyze_website for lead {lead_id}")

    try:
        lead_uuid = UUID(lead_id)
        async with AsyncSessionFactory() as session:
            if not website_url:
                from domain.lead.models import Lead
                lead = await session.get(Lead, lead_uuid)
                if lead and lead.website:
                    website_url = lead.website

            if not website_url:
                logger.info(f"Lead {lead_id} has no website to analyze, skipping")
                return

            service = WebsiteAnalysisService(session)

            # Run analysis
            analysis = await service.analyze_website(lead_uuid, website_url)

            # Save analysis to db
            session.add(analysis)
            await session.commit()
            await session.refresh(analysis)

            # Publish event
            await EventBus.publish(
                WebsiteAnalyzedEvent(
                    lead_id=lead_uuid,
                    analysis_id=analysis.id,
                    overall_score=analysis.overall_score,
                    strengths=analysis.strengths,
                    weaknesses=analysis.weaknesses,
                    pain_points=analysis.pain_points,
                )
            )

            logger.info(f"Website analysis completed for lead {lead_id}")
    except Exception as e:
        logger.error(f"Failed to analyze website for lead {lead_id}: {e}", exc_info=True)
