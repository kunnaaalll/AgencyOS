"""
AgencyOS V2 — Organization Service
"""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import ConflictException, NotFoundException
from domain.organization.schemas import (
    OrganizationCreate,
    OrganizationResponse,
    OrganizationUpdate,
)
from repositories.domain import OrganizationRepository
from utils.slugify import slugify


class OrganizationService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = OrganizationRepository(db)

    async def create_organization(self, payload: OrganizationCreate) -> OrganizationResponse:
        slug = payload.slug or slugify(payload.name)
        existing = await self.repo.get_by_slug(slug)
        if existing:
            raise ConflictException(f"Organization with slug '{slug}' already exists")

        org = await self.repo.create(name=payload.name, slug=slug)
        return OrganizationResponse.model_validate(org)

    async def get_organization(self, org_id: uuid.UUID) -> OrganizationResponse:
        org = await self.repo.get(org_id)
        if not org:
            raise NotFoundException("Organization", str(org_id))
        return OrganizationResponse.model_validate(org)

    async def list_organizations(self) -> list[OrganizationResponse]:
        items, _ = await self.repo.get_all(limit=200)
        return [OrganizationResponse.model_validate(o) for o in items]

    async def update_organization(
        self, org_id: uuid.UUID, payload: OrganizationUpdate
    ) -> OrganizationResponse:
        org = await self.repo.get(org_id)
        if not org:
            raise NotFoundException("Organization", str(org_id))
        updated = await self.repo.update(org, **payload.model_dump(exclude_none=True))
        return OrganizationResponse.model_validate(updated)
