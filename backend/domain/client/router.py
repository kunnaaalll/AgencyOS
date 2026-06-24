import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from domain.client.schemas import ClientCreate, ClientResponse, ClientStats, ClientUpdate
from domain.client.services import ClientService
from domain.role.dependencies import require_permissions
from domain.user.models import User

router = APIRouter(prefix="/clients", tags=["Clients"])

@router.get("", response_model=list[ClientResponse])
async def list_clients(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["clients:read"]))
):
    return await ClientService.get_clients(db)

@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    data: ClientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["clients:create"]))
):
    return await ClientService.create_client(db, data)

@router.get("/stats", response_model=ClientStats)
async def get_client_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["clients:read"]))
):
    return await ClientService.get_stats(db)

@router.get("/{id}", response_model=ClientResponse)
async def get_client(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["clients:read"]))
):
    return await ClientService.get_client(db, id)

@router.patch("/{id}", response_model=ClientResponse)
async def update_client(
    id: uuid.UUID,
    data: ClientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["clients:update"]))
):
    return await ClientService.update_client(db, id, data)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["clients:delete"]))
):
    await ClientService.delete_client(db, id)
