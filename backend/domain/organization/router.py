"""
AgencyOS V2 — Organization Router
"""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import require_permission
from core.database import get_db
from domain.organization.schemas import (
    OrganizationCreate,
    OrganizationResponse,
    OrganizationUpdate,
)
from domain.organization.service import OrganizationService

router = APIRouter(prefix="/organizations", tags=["Organizations"])


@router.get("", response_model=list[OrganizationResponse])
async def list_organizations(
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_permission("organizations:read")),
) -> list[OrganizationResponse]:
    return await OrganizationService(db).list_organizations()


@router.post("", response_model=OrganizationResponse, status_code=201)
async def create_organization(
    payload: OrganizationCreate,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_permission("organizations:write")),
) -> OrganizationResponse:
    return await OrganizationService(db).create_organization(payload)


@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_permission("organizations:read")),
) -> OrganizationResponse:
    return await OrganizationService(db).get_organization(org_id)


@router.patch("/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: uuid.UUID,
    payload: OrganizationUpdate,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_permission("organizations:write")),
) -> OrganizationResponse:
    return await OrganizationService(db).update_organization(org_id, payload)
