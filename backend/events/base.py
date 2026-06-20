"""
AgencyOS V2 — Base Event Classes

Foundation for the event-driven architecture.
All business events will inherit from BaseEvent.
"""

import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any


@dataclass
class EventMetadata:
    """Common metadata attached to every event."""

    event_id: uuid.UUID = field(default_factory=uuid.uuid4)
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))
    version: str = "1.0"
    source: str = "agencyos-backend"
    correlation_id: str | None = None
    user_id: str | None = None
    organization_id: str | None = None


@dataclass
class BaseEvent:
    """
    Base class for all domain events.

    Example usage (future phases):

        @dataclass
        class ContactCreatedEvent(BaseEvent):
            event_type: str = "contact.created"
            contact_id: str = ""
            email: str = ""

    """

    event_type: str
    metadata: EventMetadata = field(default_factory=EventMetadata)

    def to_dict(self) -> dict[str, Any]:
        return {
            "event_type": self.event_type,
            "metadata": {
                "event_id": str(self.metadata.event_id),
                "timestamp": self.metadata.timestamp.isoformat(),
                "version": self.metadata.version,
                "source": self.metadata.source,
                "correlation_id": self.metadata.correlation_id,
                "user_id": self.metadata.user_id,
                "organization_id": self.metadata.organization_id,
            },
        }
