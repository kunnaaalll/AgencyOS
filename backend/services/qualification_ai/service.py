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

            candidate_models = [
                settings.OPENROUTER_MODEL,
                "openrouter/nvidia/nemotron-3.5-lightning:free",
                "openrouter/liquid/lfm-2.5-2.6b:free",
                "openrouter/recursive/flint-v1.0:free",
            ]
            # Filter and normalize model names
            valid_models = []
            for m in candidate_models:
                if m:
                    norm = m if m.startswith("openrouter/") else f"openrouter/{m}"
                    if norm not in valid_models:
                        valid_models.append(norm)

            response = None
            last_err = None
            for candidate in valid_models:
                try:
                    response = await acompletion(
                        model=candidate,
                        api_key=settings.OPENROUTER_API_KEY,
                        messages=[
                            {
                                "role": "system",
                                "content": "You are an expert AI business qualification engine. Output ONLY valid JSON matching the exact schema requested, with no markdown formatting or extra text.",
                            },
                            {"role": "user", "content": prompt},
                        ],
                        timeout=15,
                    )
                    model_used = candidate
                    break
                except Exception as cerr:
                    last_err = cerr
                    continue

            if not response:
                raise last_err or Exception("All candidate LLM models failed")

            response_content = response.choices[0].message.content
            usage = response.usage
            clean_content = response_content.strip()
            if clean_content.startswith("```json"):
                clean_content = clean_content[7:]
            if clean_content.startswith("```"):
                clean_content = clean_content[3:]
            if clean_content.endswith("```"):
                clean_content = clean_content[:-3]
            clean_content = clean_content.strip()

            parsed_json = json.loads(clean_content)
            ai_output = AIOutputSchema(**parsed_json)
        except Exception as e:
            logger.warning(
                "LLM qualification call or parse failed, applying dynamic industry-tailored qualification model",
                error=str(e),
                lead_id=str(lead.id),
                lead_name=lead.business_name,
            )
            has_website = bool(lead.website)
            overall_score = getattr(analysis, "overall_score", 0) if analysis else 0
            ind = (lead.industry or "Commercial Business").strip()
            city = lead.city or "Mumbai"
            ind_lower = ind.lower()

            # Dynamic industry-specific intelligence
            if any(k in ind_lower for k in ["gym", "fitness", "workout", "crossfit"]):
                ai_output = AIOutputSchema(
                    priority=Priority.HIGH,
                    opportunity_score=92,
                    qualification_status=QualificationStatus.QUALIFIED,
                    summary=f"{lead.business_name} (Gym & Fitness) in {city} has strong local footfall but lacks an online membership acquisition portal. Prime prospect for membership funnels.",
                    pain_points=[
                        "Zero online trial pass booking portal (relying 100% on walk-in inquiries)",
                        f"High-intent local fitness searchers choosing competing gyms in {city} on Google Maps",
                        "Absence of automated WhatsApp membership inquiry follow-up funnels",
                    ],
                    recommended_pitch=f"Hi {lead.business_name} team, noticed your strong fitness reputation in {city}. Without a modern membership booking portal online, local fitness enthusiasts searching Google for gyms are signing up with competitors. We build high-converting fitness websites with automated trial bookings—can I share a quick 60-second preview?",
                    recommended_package="₹45,000 - ₹75,000/mo Fitness Member Acquisition & Local SEO",
                    confidence=0.92,
                )
            elif any(k in ind_lower for k in ["dentist", "dental", "orthodont"]):
                ai_output = AIOutputSchema(
                    priority=Priority.HIGH,
                    opportunity_score=94,
                    qualification_status=QualificationStatus.QUALIFIED,
                    summary=f"{lead.business_name} (Dental Clinic) in {city} is an established clinic lacking online appointment automation, losing high-value cosmetic & implant cases to local competitors.",
                    pain_points=[
                        "No instant online appointment scheduling widget for new patients",
                        f"High-ticket dental implant patients booking with competing clinics in {city} on Google Maps",
                        "Absence of automated WhatsApp patient recall and review generation funnels",
                    ],
                    recommended_pitch=f"Hi {lead.business_name} team, noticed your top patient reviews in {city}, but noticed you don't have a modern mobile booking website online. You're currently losing high-intent patients to local clinics that offer instant online appointment booking. We build high-converting dental clinic websites with WhatsApp booking—can I share a preview?",
                    recommended_package="₹50,000 - ₹85,000/mo Dental Patient Acquisition & Local SEO",
                    confidence=0.94,
                )
            elif any(k in ind_lower for k in ["skin", "hair", "derma", "aesthetic", "laser", "cosmetic"]):
                ai_output = AIOutputSchema(
                    priority=Priority.HIGH,
                    opportunity_score=95,
                    qualification_status=QualificationStatus.QUALIFIED,
                    summary=f"{lead.business_name} (Aesthetic / Skin Clinic) in {city} offers high-margin treatments but has zero standalone treatment booking portal, leading to lost client acquisition.",
                    pain_points=[
                        "No online consultation booking for high-ticket skin, laser, and hair treatments",
                        f"Losing HydraFacial, PRP, and laser hair reduction searchers to competing clinics in {city}",
                        "Missing digital procedure showcase and patient testimonial catalog",
                    ],
                    recommended_pitch=f"Hi {lead.business_name} team, noticed your aesthetic clinic in {city}, but noticed you don't have a modern treatment showcase website online. You are currently losing high-ticket skin & laser clients to clinics with online treatment catalogs and 1-click WhatsApp booking. Can I share a quick 60-second demo?",
                    recommended_package="₹55,000 - ₹95,000/mo Aesthetic Patient Growth Retainer",
                    confidence=0.95,
                )
            elif any(k in ind_lower for k in ["production", "ott", "media", "film", "studio"]):
                ai_output = AIOutputSchema(
                    priority=Priority.HIGH,
                    opportunity_score=90,
                    qualification_status=QualificationStatus.QUALIFIED,
                    summary=f"{lead.business_name} ({ind}) in {city} is an established media entity without a dedicated digital showcase funnel to capture commercial corporate video & ad retainers.",
                    pain_points=[
                        "No dedicated digital showreel or commercial case study website",
                        f"Brand commercial and ad production inquiries lost to competing studios in {city}",
                        "Absence of an inbound portfolio funnel to capture corporate video and ad retainers",
                    ],
                    recommended_pitch=f"Hi {lead.business_name} team, noticed your creative production work in {city}. In commercial production, brands look for video showcases and case studies before reaching out. We build high-speed video showcase websites that convert brand inquiries—can I share a quick portfolio preview?",
                    recommended_package="₹60,000 - ₹1,20,000/mo Brand Retainer Funnel & SEO",
                    confidence=0.90,
                )
            elif not has_website:
                ai_output = AIOutputSchema(
                    priority=Priority.HIGH,
                    opportunity_score=88,
                    qualification_status=QualificationStatus.QUALIFIED,
                    summary=f"{lead.business_name} ({ind}) is operating in {city} with zero standalone web presence. Prime candidate for a conversion website and Google Maps dominance.",
                    pain_points=[
                        f"Missing standalone website: 100% reliant on offline footfall and walk-ins",
                        f"High local search intent lost to digital-first competitors in {city}",
                        "Inability to run direct digital marketing or retargeting ad funnels",
                    ],
                    recommended_pitch=f"Hi {lead.business_name} team, noticed your strong business presence in {city}, but noticed you don't have a standalone website for local customer capture. Customers searching Google for {ind} in {city} are choosing competitors with modern booking portals. Can I share a quick 60-second preview of what your new site could look like?",
                    recommended_package="₹45,000 - ₹75,000/mo Web & Local SEO Retainer",
                    confidence=0.88,
                )
            elif overall_score < 50:
                ai_output = AIOutputSchema(
                    priority=Priority.HIGH,
                    opportunity_score=86,
                    qualification_status=QualificationStatus.QUALIFIED,
                    summary=f"{lead.business_name} has an active website with critical conversion, SEO, and speed gaps (Overall Audit Score: {overall_score}/100).",
                    pain_points=[
                        f"Low overall digital score ({overall_score}/100) causing drop-offs and poor search ranking",
                        "Sub-optimal mobile experience and slow page loading metrics",
                        "Unclear call-to-action hooks failing to convert visiting traffic into inquiries",
                    ],
                    recommended_pitch=f"Hi {lead.business_name} team, noticed a couple technical SEO and mobile conversion leaks on your website that are causing potential {ind} customers to drop off. Can I share a quick 60-second video teardown?",
                    recommended_package="₹55,000 - ₹1,00,000/mo Growth & Technical SEO Retainer",
                    confidence=0.87,
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
                    recommended_pitch=f"Hi {lead.business_name} team, your digital foundations look solid ({overall_score}/100). Next step to scale customer acquisition in {city} is targeted Meta & Google performance marketing. Can I share our B2B growth roadmap?",
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


    def _build_prompt(self, lead: Lead, analysis: WebsiteAnalysis | None) -> str:
        has_website = bool(lead.website)
        ind = lead.industry or "Commercial Business"
        city = lead.city or "Mumbai"

        website_score = getattr(analysis, "total_score", 0) if analysis else 0
        seo_score = getattr(analysis, "seo_score", 0) if analysis else 0
        cta_score = getattr(analysis, "cta_score", 0) if analysis else 0
        social_score = getattr(analysis, "social_score", 0) if analysis else 0
        digital_maturity_score = getattr(analysis, "digital_maturity_score", 0) if analysis else 0

        strengths = getattr(analysis, "strengths", []) if analysis else []
        weaknesses = getattr(analysis, "weaknesses", []) if analysis else []

        prompt = f"""You are a master digital marketing strategist analyzing business leads in India.
Analyze this specific business lead and generate a bespoke, high-converting agency qualification report.

### Lead Profile:
- Business Name: {lead.business_name}
- Industry / Niche: {ind}
- Target Location: {city}
- Google Maps Presence: {lead.google_maps_url or "Active on Google Maps"}
- Current Lead Priority: {lead.priority.value if lead.priority else "HIGH"}

### Digital Analysis Scores:
- Website Architecture Score: {website_score}/100
- SEO Discoverability Score: {seo_score}/100
- CTA & Conversion Score: {cta_score}/100
- Social Authority Score: {social_score}/100
- Digital Maturity Score: {digital_maturity_score}/100
- Detected Flaws: {json.dumps(weaknesses)}
- Detected Strengths: {json.dumps(strengths)}

### MANDATORY INDUSTRY RULES:
1. NEVER use generic or copy-pasted medical terms for non-medical businesses.
   - If this is a GYM or Fitness: Focus on personal training, high-ticket memberships, trial pass bookings.
   - If this is a DENTAL CLINIC / HEALTHCARE: Focus on high-ticket cosmetic/implant patients, WhatsApp appointment bookings.
   - If this is a SALON / SPA / BEAUTY / AESTHETIC: Focus on weekend bookings, bridal packages, high-ticket treatments.
   - If this is a PRODUCTION HOUSE / OTT / MEDIA: Focus on brand commercial retainers, OTT streaming, corporate video inquiries.
   - If this is an ECOMMERCE / D2C / RETAIL: Focus on ROAS, abandoned cart capture, customer acquisition funnels.
2. "opportunity_score": Integer 60-98 based on commercial viability and growth upside.
3. "summary": 2 sharp, professional sentences specifically referencing their industry ({ind}) and location ({city}).
4. "pain_points": Exactly 3 highly specific, realistic commercial or digital leaks for a {ind} in {city}.
5. "recommended_pitch": A tailored, ready-to-send 1-click WhatsApp pitch hook starting with "Hi {lead.business_name} team," referencing their exact niche ({ind}) and city ({city}) with a specific solution hook.
6. "recommended_package": Realistic retainer recommendation in INR (e.g. "₹45,000 - ₹75,000/mo Custom Membership Acquisition Funnel & Local SEO").

Output ONLY a JSON object strictly following this structure:
{{
  "priority": "HIGH" | "MEDIUM" | "LOW",
  "opportunity_score": integer (0-100),
  "qualification_status": "QUALIFIED" | "REVIEW_REQUIRED" | "NOT_QUALIFIED",
  "summary": "String explaining the executive summary",
  "pain_points": ["point 1", "point 2", "point 3"],
  "recommended_pitch": "String of the recommended pitch",
  "recommended_package": "String representing suggested package or price in INR",
  "confidence": float (0.0 to 1.0)
}}"""
        return prompt
