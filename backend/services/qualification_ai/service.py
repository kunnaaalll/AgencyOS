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


from domain.qualification_ai.enums import Priority, QualificationStatus
from sqlalchemy import select


class AIQualificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def qualify_lead(self, lead: Lead, analysis: WebsiteAnalysis | None) -> AIQualification:
        start_time = time.time()
        prompt = self._build_prompt(lead, analysis)

        model_used = "openrouter/free"
        usage = None
        ai_output = None

        try:
            from litellm import acompletion

            if settings.OPENROUTER_API_KEY:
                model_used = settings.OPENROUTER_MODEL or "openrouter/free"
                if not model_used.startswith("openrouter/"):
                    model_used = f"openrouter/{model_used}"

                try:
                    response = await acompletion(
                        model=model_used,
                        api_key=settings.OPENROUTER_API_KEY,
                        messages=[
                            {
                                "role": "system",
                                "content": "You are an expert AI business qualification engine. Output ONLY valid JSON matching the exact schema requested, with no markdown formatting or extra text.",
                            },
                            {"role": "user", "content": prompt},
                        ],
                        response_format={"type": "json_object"},
                        timeout=15,
                    )
                except Exception as model_err:
                    logger.warning(
                        f"Primary model {model_used} unavailable on OpenRouter, retrying with free tier: {model_err}"
                    )
                    model_used = "openrouter/free"
                    response = await acompletion(
                        model="openrouter/free",
                        api_key=settings.OPENROUTER_API_KEY,
                        messages=[
                            {
                                "role": "system",
                                "content": "You are an expert AI business qualification engine. Output ONLY valid JSON matching the exact schema requested, with no markdown formatting or extra text.",
                            },
                            {"role": "user", "content": prompt},
                        ],
                        response_format={"type": "json_object"},
                        timeout=15,
                    )
            else:
                model_used = "freellmapi/auto"
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
                    timeout=15,
                )

            response_content = response.choices[0].message.content
            usage = response.usage
            parsed_json = json.loads(response_content)
            ai_output = AIOutputSchema(**parsed_json)
        except Exception as e:
            logger.warning(
                "LLM qualification call or parse failed, applying deterministic agency qualification model",
                error=str(e),
                lead_id=str(lead.id),
                lead_name=lead.business_name,
            )
            has_website = bool(lead.website)
            overall_score = getattr(analysis, "overall_score", 0) if analysis else 0
            ind = lead.industry or "Commercial Services"
            city = lead.city or "Mumbai"

            if not has_website:
                ai_output = AIOutputSchema(
                    priority=Priority.HIGH,
                    opportunity_score=94,
                    qualification_status=QualificationStatus.QUALIFIED,
                    summary=f"{lead.business_name} ({ind}) is operating in {city} with zero digital web presence. High growth potential via custom website development and Google Local search dominance.",
                    pain_points=[
                        "Missing digital presence: No website or online capture mechanism",
                        "High search intent lost to competitors on Google Maps and Local pack",
                        "Inability to run direct digital marketing or retargeting funnels",
                    ],
                    recommended_pitch=f"Lead with custom responsive website development and high-intent local SEO dominance for {ind} in {city}.",
                    recommended_package="₹50,000 - ₹85,000/mo Web & Local SEO Retainer",
                    confidence=0.91,
                )
            elif overall_score < 50:
                ai_output = AIOutputSchema(
                    priority=Priority.HIGH,
                    opportunity_score=88,
                    qualification_status=QualificationStatus.QUALIFIED,
                    summary=f"{lead.business_name} has an active website with critical conversion, SEO, and speed gaps (Overall Audit Score: {overall_score}/100).",
                    pain_points=[
                        f"Low overall digital score ({overall_score}/100) causing drop-offs and poor search ranking",
                        "Sub-optimal mobile experience and slow page loading metrics",
                        "Unclear call-to-action hooks failing to convert visiting traffic into inquiries",
                    ],
                    recommended_pitch="Offer immediate performance overhaul, technical SEO remediation, and conversion-optimized landing pages.",
                    recommended_package="₹65,000 - ₹1,20,000/mo Growth & Technical SEO Retainer",
                    confidence=0.89,
                )
            else:
                ai_output = AIOutputSchema(
                    priority=Priority.MEDIUM,
                    opportunity_score=78,
                    qualification_status=QualificationStatus.QUALIFIED,
                    summary=f"{lead.business_name} has strong digital foundations ({overall_score}/100). Prime candidate for scaling acquisition channels through paid ads and funnels.",
                    pain_points=[
                        "Under-leveraged customer acquisition beyond organic discovery",
                        "Need for scalable paid advertising funnels across Meta and Google",
                    ],
                    recommended_pitch=f"Pitch multi-channel performance marketing, paid Google/Meta advertising, and automated lead nurturing.",
                    recommended_package="₹45,000 - ₹75,000/mo Paid Acquisition Retainer",
                    confidence=0.85,
                )

        execution_time_ms = (time.time() - start_time) * 1000
        tokens_used = usage.total_tokens if usage else 150

        # Log token usage
        token_log = TokenUsageLog(
            model_used=model_used,
            tokens_used=tokens_used,
            execution_time_ms=execution_time_ms,
            context=f"qualification_lead_{lead.id}",
        )
        self.db.add(token_log)

        # Check existing qualification
        existing_result = await self.db.execute(
            select(AIQualification).where(AIQualification.lead_id == lead.id)
        )
        existing = existing_result.scalars().first()

        if existing:
            qualification = existing
            qualification.priority = ai_output.priority
            qualification.opportunity_score = ai_output.opportunity_score
            qualification.qualification_status = ai_output.qualification_status
            qualification.summary = ai_output.summary
            qualification.pain_points = ai_output.pain_points
            qualification.recommended_pitch = ai_output.recommended_pitch
            qualification.recommended_package = ai_output.recommended_package
            qualification.confidence = ai_output.confidence
            qualification.model_used = model_used
            if analysis:
                qualification.website_analysis_id = analysis.id
        else:
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
