import structlog
from core.exceptions import DomainException
import json
import time
from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)


from domain.lead.models import Lead
from domain.analysis.models import WebsiteAnalysis
from domain.qualification_ai.models import AIQualification
from domain.qualification_ai.schemas import AIOutputSchema
from domain.monitoring.models import TokenUsageLog
from domain.lead.events import LeadQualifiedEvent
from events.bus import EventBus
from core.config import settings


class AIQualificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def qualify_lead(self, lead: Lead, analysis: WebsiteAnalysis) -> AIQualification:
        try:
            from litellm import acompletion
        except ImportError:
            raise DomainException(
                "litellm is not installed due to disk space constraints. Cannot run qualification."
            )

        start_time = time.time()

        prompt = self._build_prompt(lead, analysis)

        model_used = "freellmapi/auto"
        usage = None

        try:
            response = await acompletion(
                model="openai/auto",
                api_base=settings.FREELLM_API_BASE,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert AI business qualification engine. Output ONLY valid JSON matching the exact schema requested, with no markdown formatting or extra text.",
                    },
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
            )
            response_content = response.choices[0].message.content
            usage = response.usage
        except Exception as e:
            error_msg = "AI qualification failed via FreeLLM API: " + str(e)
            logger.error(error_msg, exc_info=True)
            raise DomainException(error_msg)

        execution_time_ms = (time.time() - start_time) * 1000
        tokens_used = usage.total_tokens if usage else 0

        # Log token usage
        token_log = TokenUsageLog(
            model_used=model_used,
            tokens_used=tokens_used,
            execution_time_ms=execution_time_ms,
            context=f"qualification_lead_{lead.id}",
        )
        self.db.add(token_log)

        # Parse JSON
        try:
            parsed_json = json.loads(response_content)
            # Ensure it maps to the Pydantic schema properly
            ai_output = AIOutputSchema(**parsed_json)
        except Exception as e:
            logger.error(f"Failed to parse AI output: {str(e)}", exc_info=True)
            raise DomainException(f"Failed to parse AI output: {str(e)}")

        # Create entity
        qualification = AIQualification(
            lead_id=lead.id,
            website_analysis_id=analysis.id if analysis else None,
            priority=ai_output.priority,
            opportunity_score=ai_output.opportunity_score,
            qualification_status=ai_output.qualification_status,
            summary=ai_output.summary,
            pain_points=ai_output.pain_points,
            recommended_pitch=ai_output.recommended_pitch,
            recommended_package=ai_output.recommended_package,
            confidence=ai_output.confidence,
            model_used=model_used,
        )

        self.db.add(qualification)
        await self.db.commit()
        await self.db.refresh(qualification)

        # Emit event
        event = LeadQualifiedEvent(lead_id=lead.id, priority=qualification.priority.value)
        await EventBus.publish(event)

        return qualification

    def _build_prompt(self, lead: Lead, analysis: WebsiteAnalysis) -> str:
        # Extract analysis details safely
        website_score = getattr(analysis, "total_score", 0)
        seo_score = getattr(analysis, "seo_score", 0)
        cta_score = getattr(analysis, "cta_score", 0)
        # Extract nested scoring fields gracefully
        social_score = getattr(analysis, "social_score", 0)
        digital_maturity_score = getattr(analysis, "digital_maturity_score", 0)

        strengths = getattr(analysis, "strengths", [])
        weaknesses = getattr(analysis, "weaknesses", [])

        # The prompt payload
        prompt = f"""
Evaluate the following business lead and output a JSON response matching the required schema.

### Lead Information
Business Name: {lead.business_name}
Industry: {lead.industry or "Unknown"}
Location: {lead.city or "Unknown"}, {lead.state or "Unknown"}

### Analysis Scores
Website Score: {website_score}/100
SEO Score: {seo_score}/100
CTA Score: {cta_score}/100
Social Score: {social_score}/100
Digital Maturity Score: {digital_maturity_score}/100

### Strengths
{json.dumps(strengths)}

### Weaknesses / Pain Points
{json.dumps(weaknesses)}

### Rules for Priority:
- HIGH Priority: Poor digital presence, active business, good market, strong improvement potential.
- LOW Priority: No website, inactive business, already highly optimized.
- MEDIUM Priority: Average digital presence, moderate improvement potential.

### Output Schema Rules:
Return a JSON object strictly following this structure:
{{
  "priority": "HIGH" | "MEDIUM" | "LOW",
  "opportunity_score": integer (0-100),
  "qualification_status": "QUALIFIED" | "REVIEW_REQUIRED" | "NOT_QUALIFIED",
  "summary": "String explaining the executive summary",
  "pain_points": ["point 1", "point 2"],
  "recommended_pitch": "String of the recommended pitch",
  "recommended_package": "String representing suggested package or price",
  "confidence": float (0.0 to 1.0)
}}
"""
        return prompt
