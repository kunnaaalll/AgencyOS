import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DiscoveryJobCreate(BaseModel):
    source: str

class DiscoveryJobResponse(BaseModel):
    id: uuid.UUID
    source: str
    status: str
    started_at: datetime | None
    completed_at: datetime | None
    businesses_found: int
    businesses_validated: int
    errors: list[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
