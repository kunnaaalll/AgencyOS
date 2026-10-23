import structlog
from core.exceptions import DomainException
import json
import time
from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)


from domain.lead.models import Lead
from domain.analysis.models import WebsiteAnalysis
from domain.qualification_ai.models import AIQualification
from domain.outreach.models import OutreachDraft
from domain.outreach.enums import OutreachChannel, DraftStatus
from domain.outreach.schemas import AIOutreachOutputSchema
from domain.monitoring.models import TokenUsageLog
from events.bus import EventBus
from core.config import settings
from services.harvey.prompts import HARVEY_SYSTEM_PROMPT


class OutreachGenerationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate_outreach(
        self,
        lead: Lead,
        analysis: WebsiteAnalysis | None,
        qualification: AIQualification | None,
        channel: OutreachChannel,
    ) -> OutreachDraft:
        try:
            from litellm import acompletion
        except ImportError:
            raise DomainException("litellm is not installed. Cannot run outreach generation.")

        start_time = time.time()

        prompt = self._build_prompt(lead, analysis, qualification, channel)
        usage = None

        system_content = (
            HARVEY_SYSTEM_PROMPT
            if channel == OutreachChannel.EMAIL
            else "You are an expert sales AI preparing outreach drafts. Output ONLY valid JSON matching the exact schema requested, with no markdown formatting or extra text."
        )

        try:
            if settings.OPENROUTER_API_KEY:
                model_used = settings.OPENROUTER_MODEL
                if not model_used.startswith("openrouter/"):
                    model_used = f"openrouter/{model_used}"

                try:
                    response = await acompletion(
                        model=model_used,
                        api_key=settings.OPENROUTER_API_KEY,
                        messages=[
                            {"role": "system", "content": system_content},
                            {"role": "user", "content": prompt},
                        ],
                        response_format={"type": "json_object"},
                    )
                except Exception as model_err:
                    if any(k in str(model_err).lower() for k in ["403", "404", "429", "harness", "unavailable"]):
                        logger.warning(f"Model {model_used} unavailable on OpenRouter, falling back to openrouter/free: {model_err}")
                        model_used = "openrouter/free"
                        response = await acompletion(
                            model="openrouter/free",
                            api_key=settings.OPENROUTER_API_KEY,
                            messages=[
                                {"role": "system", "content": system_content},
                                {"role": "user", "content": prompt},
                            ],
                            response_format={"type": "json_object"},
                        )
                    else:
                        raise
            else:
                model_used = "freellmapi/auto"
                response = await acompletion(
                    model="openai/auto",
                    api_base=settings.FREELLM_API_BASE,
                    messages=[
                        {"role": "system", "content": system_content},
                        {"role": "user", "content": prompt},
                    ],
                    response_format={"type": "json_object"},
                )
            response_content = response.choices[0].message.content
            usage = response.usage
        except Exception as e:
            provider = "OpenRouter" if settings.OPENROUTER_API_KEY else "FreeLLM API"
            logger.error(f"AI generation failed via {provider}: {str(e)}", exc_info=True)
            raise DomainException(f"AI generation failed via {provider}: {str(e)}")

        execution_time_ms = (time.time() - start_time) * 1000
        tokens_used = usage.total_tokens if usage else 0

        # Log token usage
        token_log = TokenUsageLog(
            model_used=model_used,
            tokens_used=tokens_used,
            execution_time_ms=execution_time_ms,
            context=f"outreach_generation_lead_{lead.id}",
        )
        self.db.add(token_log)

        # Parse JSON
        try:
            parsed_json = json.loads(response_content)
            ai_output = AIOutreachOutputSchema(**parsed_json)
        except Exception as e:
            logger.error(f"Failed to parse AI output: {str(e)}", exc_info=True)
            raise DomainException(f"Failed to parse AI output: {str(e)}")

        # Create entity
        draft = OutreachDraft(
            lead_id=lead.id,
            qualification_id=qualification.id if qualification else None,
            channel=channel,
            status=DraftStatus.DRAFT,
            subject=ai_output.subject,
            message=ai_output.message,
            talking_points=ai_output.talking_points,
            model_used=model_used,
            tokens_used=tokens_used,
        )

        self.db.add(draft)
        await self.db.commit()
        await self.db.refresh(draft)

        # Emit event
        await EventBus.publish(
            {
                "type": "OutreachDraftGenerated",
                "lead_id": lead.id,
                "draft_id": draft.id,
                "channel": channel.value,
            }
        )

        return draft

    def _build_prompt(
        self,
        lead: Lead,
        analysis: WebsiteAnalysis | None,
        qualification: AIQualification | None,
        channel: OutreachChannel,
    ) -> str:
        pain_points = (
            qualification.pain_points if qualification and qualification.pain_points else []
        )
        if not pain_points and analysis:
            pain_points = analysis.weaknesses

        recommended_pitch = (
            qualification.recommended_pitch
            if qualification
            else "Highlight how our services solve their digital weaknesses."
        )
        recommended_package = qualification.recommended_package if qualification else "Custom Plan"
        opportunity_score = qualification.opportunity_score if qualification else 0

        channel_rules = ""
        if channel == OutreachChannel.EMAIL:
            channel_rules = (
                "HARVEY RULES: Under 75 words strictly. Write like a real person sending a quick note from their laptop. "
                "Hook with ONE observed signal from their website. Zero buzzwords (ban 'delve', 'streamline', 'game-changer', 'hope this finds you well'). "
                "End with a soft CTA (e.g., 'Worth a quick 2-minute video?')."
            )
        elif channel == OutreachChannel.LINKEDIN:
            channel_rules = "Length: 50-80 words. Professional and concise."
        elif channel == OutreachChannel.WHATSAPP:
            channel_rules = "Length: 40-60 words. Friendly and conversational."
        elif channel == OutreachChannel.CALL:
            channel_rules = (
                "Generate Discovery talking points, Objection handling hints, Suggested package."
            )

        prompt = f"""
Evaluate the following business lead and output a JSON response matching the required schema.

### Lead Information
Business Name: {lead.business_name}
Industry: {lead.industry or "Unknown"}
Location: {lead.city or "Unknown"}, {lead.state or "Unknown"}

### Analysis & Qualification
Pain Points: {json.dumps(pain_points)}
Opportunity Score: {opportunity_score}
Recommended Pitch: {recommended_pitch}
Recommended Package: {recommended_package}

### Target Channel
{channel.value}

### Channel Rules
{channel_rules}

### Output Schema Rules:
Return a JSON object strictly following this structure:
{{
  "subject": "String representing the subject line (for Email) or a greeting/topic (for others)",
  "message": "String containing the outreach message or call script based on channel rules",
  "talking_points": ["point 1", "point 2", "point 3"]
}}
"""
        return prompt
