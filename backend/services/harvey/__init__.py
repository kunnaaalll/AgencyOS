"""
Harvey Sales Intelligence Module for AgencyOS.
"""

from services.harvey.signals import HarveySignalDetector, DetectedSignal
from services.harvey.prompts import HARVEY_SYSTEM_PROMPT, build_harvey_outreach_prompt, BANNED_AI_PHRASES
from services.harvey.objections import classify_objection_family, ObjectionFamily, LAARC_FRAMEWORKS

__all__ = [
    "HarveySignalDetector",
    "DetectedSignal",
    "HARVEY_SYSTEM_PROMPT",
    "build_harvey_outreach_prompt",
    "BANNED_AI_PHRASES",
    "classify_objection_family",
    "ObjectionFamily",
    "LAARC_FRAMEWORKS",
]
