import uuid
from dataclasses import dataclass
from datetime import datetime


@dataclass
class DiscoveryRunStartedEvent:
    run_id: uuid.UUID
    source: str
    query: str | None
    location: str | None
    timestamp: datetime


@dataclass
class BusinessDiscoveredEvent:
    run_id: uuid.UUID
    business_id: uuid.UUID
    source: str
    business_name: str
    timestamp: datetime


@dataclass
class BusinessValidatedEvent:
    business_id: uuid.UUID
    is_valid: bool
    validation_status: str
    timestamp: datetime


@dataclass
class LeadPromotedEvent:
    business_id: uuid.UUID
    lead_id: uuid.UUID
    timestamp: datetime
