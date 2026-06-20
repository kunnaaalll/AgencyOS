"""
AgencyOS V2 — Role Service + Router
"""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import require_permission
from core.database import get_db
from core.exceptions import ConflictException, NotFoundException
from domain.role.schemas import RoleCreate, RoleResponse, RoleUpdate
from repositories.domain import RoleRepository


class RoleService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = RoleRepository(db)

    async def create_role(self, payload: RoleCreate) -> RoleResponse:
        existing = await self.repo.get_by_name(payload.name)
        if existing:
            raise ConflictException(f"Role '{payload.name}' already exists")
        role = await self.repo.create(name=payload.name, permissions=payload.permissions)
        return RoleResponse.model_validate(role)

    async def get_role(self, role_id: uuid.UUID) -> RoleResponse:
        role = await self.repo.get(role_id)
        if not role:
            raise NotFoundException("Role", str(role_id))
        return RoleResponse.model_validate(role)

    async def list_roles(self) -> list[RoleResponse]:
        items, _ = await self.repo.get_all(limit=100)
        return [RoleResponse.model_validate(r) for r in items]

    async def update_role(self, role_id: uuid.UUID, payload: RoleUpdate) -> RoleResponse:
        role = await self.repo.get(role_id)
        if not role:
            raise NotFoundException("Role", str(role_id))
        updated = await self.repo.update(role, **payload.model_dump(exclude_none=True))
        return RoleResponse.model_validate(updated)


# ── Router ────────────────────────────────────────────────────
router = APIRouter(prefix="/roles", tags=["Roles"])


@router.get("", response_model=list[RoleResponse])
async def list_roles(
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_permission("roles:read")),
) -> list[RoleResponse]:
    return await RoleService(db).list_roles()


@router.post("", response_model=RoleResponse, status_code=201)
async def create_role(
    payload: RoleCreate,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_permission("roles:write")),
) -> RoleResponse:
    return await RoleService(db).create_role(payload)


@router.get("/{role_id}", response_model=RoleResponse)
async def get_role(
    role_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_permission("roles:read")),
) -> RoleResponse:
    return await RoleService(db).get_role(role_id)


@router.patch("/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: uuid.UUID,
    payload: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_permission("roles:write")),
) -> RoleResponse:
    return await RoleService(db).update_role(role_id, payload)
