import uuid
from dataclasses import dataclass
from events.base import BaseEvent

@dataclass
class ProjectCreatedEvent(BaseEvent):
    event_type: str = "project.created"
    project_id: str = ""
    client_id: str = ""
    name: str = ""
