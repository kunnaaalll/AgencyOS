"""
Harvey LAARC Objection Handling for AgencyOS.

Implements the LAARC framework from ethanplusai/harvey:
  - Listen: Classify prospect objection family (Budget, Authority, Need, Timing)
  - Acknowledge: Validate their perspective without defensiveness
  - Assess: Ask a diagnostic question
  - Respond: Provide concrete proof / resolution
  - Confirm: Check for alignment before advancing
"""

from enum import StrEnum
from typing import Any


class ObjectionFamily(StrEnum):
    BUDGET = "budget"          # "Too expensive", "We don't have budget"
    AUTHORITY = "authority"    # "I'm not the right person", "Need to check with boss"
    NEED = "need"              # "We already have an agency / happy with what we have"
    TIMING = "timing"          # "Reach out in Q3 / bad timing right now"
    GENERAL = "general"


LAARC_FRAMEWORKS = {
    ObjectionFamily.BUDGET: {
        "acknowledge": "Completely understand — budget is tight everywhere right now.",
        "assess": "Are you measuring how many website visitors leave without calling?",
        "angle": "Frame as self-funding: capturing just 1-2 missed clients covers the entire cost.",
    },
    ObjectionFamily.AUTHORITY: {
        "acknowledge": "Appreciate you letting me know so I don't bother you.",
        "assess": "Who on the team usually handles digital growth or customer inquiries?",
        "angle": "Ask for a simple intro without asking for their time.",
    },
    ObjectionFamily.NEED: {
        "acknowledge": "Makes sense, glad you have a solution in place.",
        "assess": "Does your current setup automatically convert weekend after-hours traffic?",
        "angle": "Focus on the single incremental gap your agency solves that the incumbent misses.",
    },
    ObjectionFamily.TIMING: {
        "acknowledge": "Totally understand, timing is everything.",
        "assess": "Would it help if I send a 2-minute overview now so you have it when ready?",
        "angle": "Low-friction stay-in-touch permission.",
    },
}


def classify_objection_family(reply_text: str) -> ObjectionFamily:
    """Classifies an incoming reply into one of Harvey's 4 objection families."""
    text = reply_text.lower()

    if any(k in text for k in ["expensive", "cost", "budget", "afford", "pricing", "rate"]):
        return ObjectionFamily.BUDGET
    if any(k in text for k in ["not the right person", "talk to", "owner handles", "boss", "manager", "someone else"]):
        return ObjectionFamily.AUTHORITY
    if any(k in text for k in ["already have", "happy with", "not interested", "don't need", "no need"]):
        return ObjectionFamily.NEED
    if any(k in text for k in ["later", "next month", "next quarter", "busy right now", "reach out next"]):
        return ObjectionFamily.TIMING

    return ObjectionFamily.GENERAL
