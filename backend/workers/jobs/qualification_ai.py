import structlog
from sqlalchemy.future import select

from core.database import AsyncSessionFactory
from domain.analysis.models import WebsiteAnalysis
from domain.lead.models import Lead
from services.qualification_ai.service import AIQualificationService

logger = structlog.get_logger()


async def qualify_lead_job(ctx: dict, lead_id: str) -> dict:
    logger.info(f"Starting AI Qualification job for lead_id={lead_id}")

    async with AsyncSessionFactory() as db:
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

            if not analysis:
                logger.warning(f"No website analysis found for lead {lead_id}, proceeding anyway.")
                # We can still qualify with basic info if analysis is not mandatory,
                # but depending on requirements it might be mandatory.
                # Assuming analysis can be None or we handle it gracefully.

            service = AIQualificationService(db)
            qualification = await service.qualify_lead(lead, analysis)

            logger.info(
                f"Successfully qualified lead_id={lead_id} with status={qualification.qualification_status.value}"
            )
            return {"success": True, "qualification_id": qualification.id}

        except Exception as e:
            logger.error(f"Error qualifying lead_id={lead_id}: {str(e)}")
            await db.rollback()
            return {"success": False, "error": str(e)}
