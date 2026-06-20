"""
AgencyOS V2 — User Service
"""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import ConflictException, NotFoundException
from core.security import hash_password
from domain.user.schemas import UserCreate, UserListResponse, UserResponse, UserUpdate
from repositories.domain import UserRepository


class UserService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = UserRepository(db)

    async def create_user(self, payload: UserCreate) -> UserResponse:
        existing = await self.repo.get_by_email(payload.email)
        if existing:
            raise ConflictException(f"User with email '{payload.email}' already exists")

        user = await self.repo.create(
            email=payload.email.lower().strip(),
            hashed_password=hash_password(payload.password),
            first_name=payload.first_name,
            last_name=payload.last_name,
            organization_id=payload.organization_id,
            role_id=payload.role_id,
        )
        return UserResponse.model_validate(user)

    async def get_user(self, user_id: uuid.UUID) -> UserResponse:
        user = await self.repo.get(user_id)
        if not user:
            raise NotFoundException("User", str(user_id))
        return UserResponse.model_validate(user)

    async def list_users(self, page: int = 1, page_size: int = 20) -> UserListResponse:
        skip = (page - 1) * page_size
        items, total = await self.repo.get_all(skip=skip, limit=page_size)
        return UserListResponse(
            items=[UserResponse.model_validate(u) for u in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def update_user(self, user_id: uuid.UUID, payload: UserUpdate) -> UserResponse:
        user = await self.repo.get(user_id)
        if not user:
            raise NotFoundException("User", str(user_id))
        updated = await self.repo.update(user, **payload.model_dump(exclude_none=True))
        return UserResponse.model_validate(updated)

    async def delete_user(self, user_id: uuid.UUID) -> None:
        user = await self.repo.get(user_id)
        if not user:
            raise NotFoundException("User", str(user_id))
        await self.repo.delete(user)
