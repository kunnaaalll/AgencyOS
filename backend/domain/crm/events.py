from dataclasses import dataclass

from events.base import BaseEvent


@dataclass
class OpportunityCreatedEvent(BaseEvent):
    event_type: str = "crm.opportunity.created"
    opportunity_id: str = ""
    lead_id: str = ""
    title: str = ""

@dataclass
class OpportunityStageChangedEvent(BaseEvent):
    event_type: str = "crm.opportunity.stage_changed"
    opportunity_id: str = ""
    old_stage: str = ""
    new_stage: str = ""

@dataclass
class MeetingScheduledEvent(BaseEvent):
    event_type: str = "crm.meeting.scheduled"
    meeting_id: str = ""
    opportunity_id: str = ""

@dataclass
class OpportunityWonEvent(BaseEvent):
    event_type: str = "crm.opportunity.won"
    opportunity_id: str = ""
    value: int = 0

@dataclass
class OpportunityLostEvent(BaseEvent):
    event_type: str = "crm.opportunity.lost"
    opportunity_id: str = ""
