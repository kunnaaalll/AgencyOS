"""
AgencyOS V2.1 — Auth Service
Business logic for authentication operations.
Includes: login, refresh token rotation, logout with revocation,
brute-force protection, password change, and audit logging.
"""

import structlog
from jose import JWTError
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.audit import (
    audit_account_locked,
    audit_login,
    audit_login_failed,
    audit_logout,
    audit_password_change,
)
from core.config import settings
from core.exceptions import (
    InvalidTokenException,
    RateLimitException,
    UnauthorizedException,
    ValidationException,
)
from core.redis import get_redis
from core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_password,
    needs_rehash,
    validate_password_strength,
    verify_password,
)
from core.token_blacklist import is_token_revoked, revoke_token
from domain.auth.schemas import MeResponse, TokenResponse
from domain.user.models import User

logger = structlog.get_logger(__name__)

# Redis key prefixes for login tracking
LOGIN_ATTEMPTS_PREFIX = "login:attempts:"
LOGIN_LOCKOUT_PREFIX = "login:lockout:"


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def login(
        self,
        email: str,
        password: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> TokenResponse:
        """
        Authenticate user with email + password.
        Includes brute-force protection and audit logging.
        """
        normalized_email = email.lower().strip()

        # Check if account is locked out
        await self._check_lockout(normalized_email)

        user = await self._get_user_by_email(normalized_email)

        if not user or not verify_password(password, user.hashed_password):
            await self._record_failed_login(normalized_email, ip_address, user_agent)
            raise UnauthorizedException("Invalid email or password")

        if not user.is_active:
            raise UnauthorizedException("Account is deactivated")

        # Clear failed attempts on successful login
        await self._clear_failed_attempts(normalized_email)

        # Transparent password re-hash (bcrypt → Argon2 migration)
        if needs_rehash(user.hashed_password):
            new_hash = hash_password(password)
            await self.db.execute(
                update(User).where(User.id == user.id).values(hashed_password=new_hash)
            )
            await self.db.flush()
            logger.info("Password rehashed for user", user_id=str(user.id))

        # Audit login
        try:
            await audit_login(self.db, str(user.id), normalized_email, ip_address, user_agent)
        except Exception:
            logger.warning("Failed to write audit log for login", user_id=str(user.id))

        return await self._build_token_response(user)

    async def refresh(self, refresh_token: str) -> TokenResponse:
        """
        Issue a new access + refresh token pair using a valid refresh token.
        Implements refresh token rotation: old token is revoked on use.
        """
        try:
            payload = decode_refresh_token(refresh_token)
        except JWTError as e:
            raise InvalidTokenException("Invalid or expired refresh token") from e

        # Check if token has been revoked
        if await is_token_revoked(payload.jti):
            logger.warning("Attempted use of revoked refresh token", jti=payload.jti)
            raise InvalidTokenException("Refresh token has been revoked")

        user = await self._get_user_by_id(payload.sub)
        if not user or not user.is_active:
            raise UnauthorizedException("User not found or deactivated")

        # Revoke the old refresh token (rotation)
        if payload.exp:
            await revoke_token(payload.jti, payload.exp)

        return await self._build_token_response(user)

    async def logout(
        self,
        refresh_token: str,
        ip_address: str | None = None,
    ) -> None:
        """Invalidate a refresh token by adding it to the blacklist."""
        try:
            payload = decode_refresh_token(refresh_token)
            if payload.exp:
                await revoke_token(payload.jti, payload.exp)

            # Audit logout
            try:
                await audit_logout(self.db, payload.sub, ip_address)
            except Exception:
                logger.warning("Failed to write audit log for logout")

        except JWTError:
            # Token already expired or invalid — no action needed
            pass

    async def change_password(
        self,
        user: User,
        current_password: str,
        new_password: str,
        ip_address: str | None = None,
    ) -> None:
        """Change user password with validation."""
        # Verify current password
        if not verify_password(current_password, user.hashed_password):
            raise UnauthorizedException("Current password is incorrect")

        # Validate new password strength
        errors = validate_password_strength(new_password)
        if errors:
            raise ValidationException("; ".join(errors))

        # Ensure new password is different from current
        if verify_password(new_password, user.hashed_password):
            raise ValidationException("New password must be different from current password")

        # Hash and update
        new_hash = hash_password(new_password)
        await self.db.execute(
            update(User).where(User.id == user.id).values(hashed_password=new_hash)
        )
        await self.db.flush()

        # Audit password change
        try:
            await audit_password_change(self.db, str(user.id), ip_address)
        except Exception:
            logger.warning("Failed to write audit log for password change")

        logger.info("Password changed", user_id=str(user.id))

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

    # ── Brute-Force Protection ────────────────────────────────

    async def _check_lockout(self, email: str) -> None:
        """Check if the account is locked due to too many failed attempts."""
        redis = await get_redis()
        lockout_key = f"{LOGIN_LOCKOUT_PREFIX}{email}"
        is_locked = await redis.exists(lockout_key)
        if is_locked:
            ttl = await redis.ttl(lockout_key)
            raise RateLimitException(
                f"Account temporarily locked. Try again in {ttl // 60 + 1} minutes."
            )

    async def _record_failed_login(
        self,
        email: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> None:
        """Record a failed login attempt and lock account if threshold exceeded."""
        redis = await get_redis()
        attempts_key = f"{LOGIN_ATTEMPTS_PREFIX}{email}"

        # Increment failed attempts
        count = await redis.incr(attempts_key)
        if count == 1:
            # Set TTL on first failure (window of tracking)
            await redis.expire(attempts_key, settings.LOGIN_LOCKOUT_MINUTES * 60)

        # Audit failed login
        try:
            await audit_login_failed(self.db, email, ip_address, user_agent)
        except Exception:
            pass

        # Lock account if threshold exceeded
        if count >= settings.LOGIN_MAX_ATTEMPTS:
            lockout_key = f"{LOGIN_LOCKOUT_PREFIX}{email}"
            await redis.setex(lockout_key, settings.LOGIN_LOCKOUT_MINUTES * 60, "1")
            await redis.delete(attempts_key)

            try:
                await audit_account_locked(self.db, email, ip_address)
            except Exception:
                pass

            logger.warning(
                "Account locked due to failed login attempts",
                email=email,
                attempts=count,
            )
            raise RateLimitException(
                f"Account locked for {settings.LOGIN_LOCKOUT_MINUTES} minutes due to too many failed attempts."
            )

    async def _clear_failed_attempts(self, email: str) -> None:
        """Clear failed login attempts on successful login."""
        redis = await get_redis()
        await redis.delete(f"{LOGIN_ATTEMPTS_PREFIX}{email}")

    # ── Private Helpers ───────────────────────────────────────

    async def _get_user_by_email(self, email: str) -> User | None:
        from sqlalchemy.orm import selectinload
        result = await self.db.execute(
            select(User).options(selectinload(User.role)).where(User.email == email.lower().strip())
        )
        return result.scalar_one_or_none()

    async def _get_user_by_id(self, user_id: str) -> User | None:
        from sqlalchemy.orm import selectinload
        result = await self.db.execute(
            select(User).options(selectinload(User.role)).where(User.id == user_id)
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
