"""
AgencyOS V2 — User Router (Admin endpoints)
GET    /api/users
POST   /api/users
GET    /api/users/{user_id}
PATCH  /api/users/{user_id}
DELETE /api/users/{user_id}
"""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import require_permission
from core.database import get_db
from domain.user.schemas import UserCreate, UserListResponse, UserResponse, UserUpdate
from domain.user.service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=UserListResponse)
async def list_users(
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_permission("users:read")),
) -> UserListResponse:
    return await UserService(db).list_users(page=page, page_size=page_size)


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_permission("users:write")),
) -> UserResponse:
    return await UserService(db).create_user(payload)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_permission("users:read")),
) -> UserResponse:
    return await UserService(db).get_user(user_id)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_permission("users:write")),
) -> UserResponse:
    return await UserService(db).update_user(user_id, payload)


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_permission("users:delete")),
) -> None:
    await UserService(db).delete_user(user_id)
