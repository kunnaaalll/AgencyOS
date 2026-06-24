from dataclasses import dataclass, field
from uuid import UUID

from events.base import BaseEvent


@dataclass
class WebsiteAnalyzedEvent(BaseEvent):
    """Fired when a website analysis is completed."""

    event_type: str = "analysis.website_analyzed"

    lead_id: UUID | None = None
    analysis_id: UUID | None = None
    overall_score: int | None = None
    strengths: list[str] = field(default_factory=list)
    weaknesses: list[str] = field(default_factory=list)
    pain_points: list[str] = field(default_factory=list)
