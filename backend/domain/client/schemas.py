import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from domain.client.enums import ClientStatus, HealthStatus


class ClientBase(BaseModel):
    business_name: str
    primary_contact_name: str | None = None
    primary_contact_email: str | None = None
    primary_contact_phone: str | None = None
    package_type: str | None = None
    monthly_retainer: int = 0
    contract_start_date: datetime | None = None
    contract_end_date: datetime | None = None
    status: ClientStatus = ClientStatus.ACTIVE
    health_status: HealthStatus = HealthStatus.HEALTHY
    renewal_probability: int = 50
    notes: str | None = None

class ClientCreate(ClientBase):
    opportunity_id: uuid.UUID | None = None

class ClientUpdate(BaseModel):
    business_name: str | None = None
    primary_contact_name: str | None = None
    primary_contact_email: str | None = None
    primary_contact_phone: str | None = None
    package_type: str | None = None
    monthly_retainer: int | None = None
    contract_start_date: datetime | None = None
    contract_end_date: datetime | None = None
    status: ClientStatus | None = None
    health_status: HealthStatus | None = None
    renewal_probability: int | None = None
    notes: str | None = None

class ClientResponse(ClientBase):
    id: uuid.UUID
    opportunity_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ClientStats(BaseModel):
    active_clients: int
    monthly_retainer_revenue: int
    at_risk_clients: int
    renewals_due: int
