import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

from domain.client.enums import ClientStatus, HealthStatus

class ClientBase(BaseModel):
    business_name: str
    primary_contact_name: Optional[str] = None
    primary_contact_email: Optional[str] = None
    primary_contact_phone: Optional[str] = None
    package_type: Optional[str] = None
    monthly_retainer: int = 0
    contract_start_date: Optional[datetime] = None
    contract_end_date: Optional[datetime] = None
    status: ClientStatus = ClientStatus.ACTIVE
    health_status: HealthStatus = HealthStatus.HEALTHY
    renewal_probability: int = 50
    notes: Optional[str] = None

class ClientCreate(ClientBase):
    opportunity_id: Optional[uuid.UUID] = None

class ClientUpdate(BaseModel):
    business_name: Optional[str] = None
    primary_contact_name: Optional[str] = None
    primary_contact_email: Optional[str] = None
    primary_contact_phone: Optional[str] = None
    package_type: Optional[str] = None
    monthly_retainer: Optional[int] = None
    contract_start_date: Optional[datetime] = None
    contract_end_date: Optional[datetime] = None
    status: Optional[ClientStatus] = None
    health_status: Optional[HealthStatus] = None
    renewal_probability: Optional[int] = None
    notes: Optional[str] = None

class ClientResponse(ClientBase):
    id: uuid.UUID
    opportunity_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ClientStats(BaseModel):
    active_clients: int
    monthly_retainer_revenue: int
    at_risk_clients: int
    renewals_due: int
