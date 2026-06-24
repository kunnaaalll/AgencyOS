"""
AgencyOS V2.1 — FastAPI Dependency Injection
Provides reusable dependencies for authentication, RBAC, and token validation.
"""

from collections.abc import Callable

import structlog
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.exceptions import ForbiddenException, InvalidTokenException, UnauthorizedException
from core.security import decode_access_token
from core.token_blacklist import is_token_revoked
from domain.user.models import User

logger = structlog.get_logger(__name__)

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Extract and validate the Bearer token, returning the authenticated user.
    Checks token blacklist for revoked tokens.
    Raises 401 if missing, invalid, or revoked.
    """
    if not credentials:
        raise UnauthorizedException("Missing authentication token")

    try:
        payload = decode_access_token(credentials.credentials)
    except JWTError as e:
        raise InvalidTokenException(str(e)) from e

    # Check if token has been revoked
    if payload.jti and await is_token_revoked(payload.jti):
        raise InvalidTokenException("Token has been revoked")

    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(User).options(selectinload(User.role)).where(User.id == payload.sub)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise UnauthorizedException("User not found")
    if not user.is_active:
        raise UnauthorizedException("Account is deactivated")

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Alias — ensures user is authenticated and active."""
    return current_user


def require_permission(permission: str) -> Callable:
    """
    Dependency factory: require the current user to have a specific permission.
    Usage: Depends(require_permission("pipeline:read"))
    """

    async def permission_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        # Load role relationship if not already loaded
        if current_user.role is None:
            raise ForbiddenException(f"No role assigned. Required: {permission}")

        if not current_user.has_permission(permission):
            raise ForbiddenException(
                f"Permission denied. Required: {permission}, Role: {current_user.role.name}"
            )

        return current_user

    return permission_checker


def require_any_permission(*permissions: str) -> Callable:
    """
    Dependency factory: require the user to have ANY of the listed permissions.
    """

    async def permission_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role is None:
            raise ForbiddenException("No role assigned")

        if not any(current_user.has_permission(p) for p in permissions):
            raise ForbiddenException(
                f"Permission denied. Required one of: {', '.join(permissions)}"
            )

        return current_user

    return permission_checker


def require_roles(roles: list) -> Callable:
    """
    Dependency factory: require the current user to have one of the specified roles.
    """

    async def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role is None:
            raise ForbiddenException("No role assigned")

        role_values = [r.value if hasattr(r, "value") else str(r) for r in roles]
        if current_user.role.name not in role_values:
            raise ForbiddenException(
                f"Permission denied. Required one of roles: {', '.join(role_values)}"
            )

        return current_user

    return role_checker
