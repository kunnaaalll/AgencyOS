import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DiscoveryRunCreate(BaseModel):
    source: str
    query: str | None = None
    location: str | None = None
    limit: int = 10

class DiscoveryRunResponse(BaseModel):
    id: uuid.UUID
    source: str
    status: str
    query: str | None
    location: str | None
    started_at: datetime | None
    completed_at: datetime | None
    businesses_discovered: int
    businesses_validated: int
    businesses_created: int
    error_message: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class RawBusinessResponse(BaseModel):
    id: uuid.UUID
    source: str
    business_name: str
    website: str | None
    phone: str | None
    email: str | None
    address: str | None
    city: str | None
    state: str | None
    country: str | None
    industry: str | None
    google_maps_url: str | None
    raw_payload: dict
    validation_status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
