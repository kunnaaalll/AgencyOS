import uuid
from dataclasses import dataclass
from events.base import BaseEvent

@dataclass
class ClientCreatedEvent(BaseEvent):
    event_type: str = "client.created"
    client_id: str = ""
    opportunity_id: str = ""
    business_name: str = ""

@dataclass
class ClientHealthChangedEvent(BaseEvent):
    event_type: str = "client.health_changed"
    client_id: str = ""
    old_health: str = ""
    new_health: str = ""
