import structlog
from arq.connections import ArqRedis
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from core.database import async_session_maker
from domain.lead.models import Lead
from domain.analysis.models import WebsiteAnalysis
from domain.qualification_ai.models import AIQualification
from domain.outreach.enums import OutreachChannel
from services.outreach.service import OutreachGenerationService

logger = structlog.get_logger()

async def generate_outreach_job(ctx: dict, lead_id: str, channel: str) -> dict:
    logger.info(f"Starting Outreach Generation job for lead_id={lead_id} channel={channel}")
    
    async with async_session_maker() as db:
        try:
            # Get the lead
            result = await db.execute(select(Lead).where(Lead.id == lead_id))
            lead = result.scalars().first()
            if not lead:
                logger.error(f"Lead {lead_id} not found.")
                return {"success": False, "error": "Lead not found"}

            # Get the most recent website analysis
            analysis_result = await db.execute(
                select(WebsiteAnalysis)
                .where(WebsiteAnalysis.lead_id == lead_id)
                .order_by(WebsiteAnalysis.created_at.desc())
            )
            analysis = analysis_result.scalars().first()
            
            # Get the most recent qualification
            qualification_result = await db.execute(
                select(AIQualification)
                .where(AIQualification.lead_id == lead_id)
                .order_by(AIQualification.created_at.desc())
            )
            qualification = qualification_result.scalars().first()

            outreach_channel = OutreachChannel(channel)
            service = OutreachGenerationService(db)
            draft = await service.generate_outreach(lead, analysis, qualification, outreach_channel)
            
            logger.info(f"Successfully generated outreach draft_id={draft.id} for lead_id={lead_id}")
            return {"success": True, "draft_id": draft.id}
            
        except Exception as e:
            logger.error(f"Error generating outreach for lead_id={lead_id}: {str(e)}")
            await db.rollback()
            return {"success": False, "error": str(e)}
