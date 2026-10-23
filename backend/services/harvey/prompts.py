"""
Harvey Anti-AI Email Frameworks for AgencyOS.

Ports the high-converting email rules from ethanplusai/harvey:
  - Write like a real person sending a real email from their phone/laptop.
  - Hard ban on AI phrases:
      "I hope this finds you well", "I wanted to reach out", "circling back",
      "delve", "streamline", "cutting-edge", "game-changing", "testament to", "synergistic"
  - Word count discipline:
      Email 1: Under 75 words
      Email 2: Under 75 words
      Email 3: Under 40 words
  - Proven Frameworks:
      PAS (Problem - Agitate - Solution)
      BAB (Before - After - Bridge)
      QVC (Question - Value - Call to Action)
"""

import json
from typing import Any

# Hard ban list of AI telltales
BANNED_AI_PHRASES = [
    "i hope this finds you well",
    "i hope this email finds you well",
    "i wanted to reach out",
    "reaching out to you",
    "circling back",
    "delve",
    "streamline",
    "cutting-edge",
    "game-changer",
    "game changing",
    "testament to",
    "synergistic",
    "in today's fast-paced digital world",
    "transform your business",
    "unlock your potential",
    "take your business to the next level",
    "boost your ROI",
]

HARVEY_SYSTEM_PROMPT = """You are Harvey, the client acquisition engine for our premier Digital Marketing Agency.
Our agency specializes in:
1. Google Ads & Meta Ads Management (eliminating wasted ad spend and maximizing lead volume)
2. Local SEO & Google Map Pack Dominance (ranking businesses above their local competitors)
3. High-Converting Web Design & Speed Optimization (turning visitors into paying clients)
4. 24/7 Booking & Lead Capture Automations (capturing after-hours and mobile leads)

Your primary rule: WRITE LIKE A REAL HUMAN MARKETING CONSULTANT SENDING A QUICK 2-SENTENCE EMAIL FROM A LAPTOP.

CRITICAL RULES:
1. WORD COUNT: Maximum 75 words total. Shorter is better.
2. ABSOLUTE BAN on standard AI clichés:
   - NEVER say "I hope this finds you well"
   - NEVER say "I wanted to reach out" or "Just following up"
   - NEVER say "delve", "streamline", "game-changer", "cutting-edge", "transform", "synergy"
   - NEVER say "in today's digital landscape" or "take your business to the next level"
3. TONE: Observant, helpful, direct, peer-to-peer. You are pointing out a real money leak in their digital marketing.
4. HOOK: Open by directly mentioning ONE specific factual observation from their digital presence:
   - If they are running Google/Meta Ads: Point out how their landing page or mobile experience is leaking clicks they pay for.
   - If their website has an incumbent agency: Note that their current setup is missing modern conversion elements or local SEO markup.
   - If they lack online booking: Note how they are losing after-hours clients who won't pick up the phone.
   - If their reviews are strong but SEO is weak: Note how their 5-star reputation is hidden on page 2.
5. SOFT CTA: Never push for a 30-minute sales call. Offer a low-friction teardown:
   - "Worth a quick 2-minute video showing where this is leaking?"
   - "Want me to send over a 1-page breakdown of how to fix this?"
   - "Open to taking a look at the teardown?"
6. FORMAT: Output MUST be strictly valid JSON matching the schema.
"""


def build_harvey_outreach_prompt(
    business_name: str,
    industry: str,
    city: str,
    signals: list[str],
    pain_points: list[str],
    framework: str = "QVC",
) -> str:
    """Builds a structured prompt tailored to Harvey's sales frameworks."""

    return f"""Analyze the lead and compose an ultra-concise, non-AI cold email using the {framework} framework.

### Business Details
- Company: {business_name}
- Industry: {industry or 'Local Service'}
- Location: {city or 'Local'}

### Observed Signals & Pain Points
{json.dumps(signals or pain_points or ['Missing automated booking options'])}

### Framework Selection: {framework}
- If QVC: (Question about their specific weakness -> 1 sentence of Value -> Soft Call to Action)
- If PAS: (Identify observed Problem -> Brief Agitation -> Simple Solution)
- If BAB: (Current state with gap -> Desired outcome -> Bridge to fix it)

### Output Format (Strict JSON ONLY):
{{
  "subject": "3-5 word lowercase or title subject referencing their specific company or topic (e.g., '{business_name} bookings question')",
  "message": "The under-75-word email message text.",
  "talking_points": ["Specific observation 1", "Proposed fix 2"]
}}
"""
