import uuid
from collections.abc import Sequence

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from domain.client.enums import ClientStatus, HealthStatus
from domain.client.events import ClientCreatedEvent, ClientHealthChangedEvent
from domain.client.models import Client
from domain.client.schemas import ClientCreate, ClientStats, ClientUpdate
from events.dispatcher import dispatch_event


class ClientService:
    @staticmethod
    async def get_clients(db: AsyncSession) -> Sequence[Client]:
        stmt = select(Client).order_by(Client.created_at.desc())
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_client(db: AsyncSession, client_id: uuid.UUID) -> Client:
        stmt = select(Client).where(Client.id == client_id)
        result = await db.execute(stmt)
        client = result.scalar_one_or_none()
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
        return client

    @staticmethod
    async def create_client(db: AsyncSession, data: ClientCreate) -> Client:
        client = Client(
            opportunity_id=data.opportunity_id,
            business_name=data.business_name,
            primary_contact_name=data.primary_contact_name,
            primary_contact_email=data.primary_contact_email,
            primary_contact_phone=data.primary_contact_phone,
            package_type=data.package_type,
            monthly_retainer=data.monthly_retainer,
            contract_start_date=data.contract_start_date,
            contract_end_date=data.contract_end_date,
            status=data.status,
            health_status=data.health_status,
            renewal_probability=data.renewal_probability,
            notes=data.notes,
        )
        db.add(client)
        await db.flush()

        await dispatch_event(
            ClientCreatedEvent(
                client_id=str(client.id),
                opportunity_id=str(client.opportunity_id) if client.opportunity_id else "",
                business_name=client.business_name,
            )
        )
        return client

    @staticmethod
    async def update_client(db: AsyncSession, client_id: uuid.UUID, data: ClientUpdate) -> Client:
        client = await ClientService.get_client(db, client_id)

        old_health = client.health_status

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(client, key, value)

        await db.flush()

        if "health_status" in update_data and old_health != client.health_status:
            await dispatch_event(
                ClientHealthChangedEvent(
                    client_id=str(client.id),
                    old_health=old_health.value,
                    new_health=client.health_status.value,
                )
            )

        return client

    @staticmethod
    async def delete_client(db: AsyncSession, client_id: uuid.UUID) -> None:
        client = await ClientService.get_client(db, client_id)
        await db.delete(client)
        await db.flush()

    @staticmethod
    async def get_stats(db: AsyncSession) -> ClientStats:
        stmt = select(Client)
        result = await db.execute(stmt)
        clients = result.scalars().all()

        active_clients = sum(1 for c in clients if c.status == ClientStatus.ACTIVE)
        monthly_retainer_revenue = sum(
            c.monthly_retainer for c in clients if c.status == ClientStatus.ACTIVE
        )
        at_risk_clients = sum(
            1
            for c in clients
            if c.health_status == HealthStatus.AT_RISK and c.status == ClientStatus.ACTIVE
        )
        renewals_due = sum(
            1
            for c in clients
            if c.health_status == HealthStatus.RENEWAL_DUE and c.status == ClientStatus.ACTIVE
        )

        return ClientStats(
            active_clients=active_clients,
            monthly_retainer_revenue=monthly_retainer_revenue,
            at_risk_clients=at_risk_clients,
            renewals_due=renewals_due,
        )
