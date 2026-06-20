from typing import Callable

from fastapi import Depends

from api.deps import get_current_user
from core.exceptions import ForbiddenException
from domain.user.models import User


def require_permissions(permissions: list[str]) -> Callable:
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
