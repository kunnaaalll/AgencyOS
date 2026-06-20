import uuid
from dataclasses import dataclass
from events.base import BaseEvent

@dataclass
class TaskCreatedEvent(BaseEvent):
    event_type: str = "task.created"
    task_id: str = ""
    project_id: str = ""
    title: str = ""
