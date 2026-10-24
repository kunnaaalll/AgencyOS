import structlog
from sqlalchemy.future import select

from core.database import AsyncSessionFactory
from domain.analysis.models import WebsiteAnalysis
from domain.lead.models import Lead
from services.qualification_ai.service import AIQualificationService

logger = structlog.get_logger()


async def qualify_lead_job(ctx: dict, lead_id: str) -> dict:
    import uuid
    logger.info(f"Starting AI Qualification job for lead_id={lead_id}")

    async with AsyncSessionFactory() as db:
        try:
            try:
                lead_uuid = uuid.UUID(str(lead_id))
            except Exception:
                lead_uuid = lead_id

            # Get the lead
            result = await db.execute(select(Lead).where(Lead.id == lead_uuid))
            lead = result.scalars().first()
            if not lead:
                logger.error(f"Lead {lead_id} not found.")
                return {"success": False, "error": "Lead not found"}

            # Get the most recent website analysis
            analysis_result = await db.execute(
                select(WebsiteAnalysis)
                .where(WebsiteAnalysis.lead_id == lead_uuid)
                .order_by(WebsiteAnalysis.analyzed_at.desc())
            )
            analysis = analysis_result.scalars().first()

            service = AIQualificationService(db)
            qualification = await service.qualify_lead(lead, analysis)

            logger.info(
                f"Successfully qualified lead_id={lead_id} with status={qualification.qualification_status.value}"
            )
            return {"success": True, "qualification_id": str(qualification.id)}

        except Exception as e:
            logger.error(f"Error qualifying lead_id={lead_id}: {str(e)}", exc_info=True)
            await db.rollback()
            return {"success": False, "error": str(e)}

