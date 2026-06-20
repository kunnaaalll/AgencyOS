"""
AgencyOS V2 — Auth Service
Business logic for authentication operations.
"""

from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.exceptions import InvalidTokenException, UnauthorizedException
from core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    verify_password,
)
from domain.auth.schemas import MeResponse, TokenResponse
from domain.user.models import User


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def login(self, email: str, password: str) -> TokenResponse:
        """
        Authenticate user with email + password.
        Returns access and refresh tokens on success.
        """
        user = await self._get_user_by_email(email)

        if not user or not verify_password(password, user.hashed_password):
            raise UnauthorizedException("Invalid email or password")

        if not user.is_active:
            raise UnauthorizedException("Account is deactivated")

        return await self._build_token_response(user)

    async def refresh(self, refresh_token: str) -> TokenResponse:
        """
        Issue a new access + refresh token pair using a valid refresh token.
        """
        try:
            payload = decode_refresh_token(refresh_token)
        except JWTError as e:
            raise InvalidTokenException("Invalid or expired refresh token") from e

        user = await self._get_user_by_id(payload.sub)
        if not user or not user.is_active:
            raise UnauthorizedException("User not found or deactivated")

        return await self._build_token_response(user)

    async def logout(self, refresh_token: str) -> None:
        """
        Invalidate a refresh token.
        TODO: Add token to Redis blocklist when blocklist feature is implemented.
        """
        # Phase 1: stateless logout — client discards tokens
        # Future: store token jti in Redis with expiry
        pass

    async def get_current_user_info(self, user: User) -> MeResponse:
        """Build the /me response for the authenticated user."""
        return MeResponse(
            id=str(user.id),
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            full_name=user.full_name,
            is_active=user.is_active,
            organization_id=str(user.organization_id) if user.organization_id else None,
            role_name=user.role.name if user.role else None,
        )

    # ── Private Helpers ───────────────────────────────────────

    async def _get_user_by_email(self, email: str) -> User | None:
        result = await self.db.execute(
            select(User).where(User.email == email.lower().strip())
        )
        return result.scalar_one_or_none()

    async def _get_user_by_id(self, user_id: str) -> User | None:
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def _build_token_response(self, user: User) -> TokenResponse:
        org_id = str(user.organization_id) if user.organization_id else None
        role_name = user.role.name if user.role else None

        access_token = create_access_token(
            user_id=str(user.id),
            organization_id=org_id,
            role_name=role_name,
        )
        refresh_token = create_refresh_token(user_id=str(user.id))

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
