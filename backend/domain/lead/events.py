from dataclasses import dataclass

from events.base import BaseEvent


@dataclass
class LeadCreatedEvent(BaseEvent):
    event_type: str = "lead.created"
    lead_id: str = ""
    business_name: str = ""

@dataclass
class LeadAnalyzedEvent(BaseEvent):
    event_type: str = "lead.analyzed"
    lead_id: str = ""
    total_score: int = 0

@dataclass
class LeadQualifiedEvent(BaseEvent):
    event_type: str = "lead.qualified"
    lead_id: str = ""
    priority: str = ""
