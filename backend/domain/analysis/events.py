from typing import Any
from uuid import UUID

from pydantic import Field

from events.base import Event


class WebsiteAnalyzedEvent(Event):
    """Fired when a website analysis is completed."""

    event_type: str = "analysis.website_analyzed"
    
    lead_id: UUID
    analysis_id: UUID
    overall_score: int | None
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    pain_points: list[str] = Field(default_factory=list)
