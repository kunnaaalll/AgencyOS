"""
AgencyOS V2.1 — Security: JWT, Password Hashing (Argon2), Password Validation
"""

import re
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from argon2 import PasswordHasher
from argon2.exceptions import VerificationError, VerifyMismatchError
from jose import JWTError, jwt
from passlib.context import CryptContext

from core.config import settings

# ── Password Hashing (Argon2 primary, bcrypt legacy) ─────────
# Argon2id is the recommended algorithm for password hashing.
# We keep bcrypt as a deprecated scheme to transparently re-hash
# existing passwords on next login.
ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,  # 64 MiB
    parallelism=4,
    hash_len=32,
    salt_len=16,
)

# Legacy context for verifying old bcrypt hashes during migration
_legacy_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plain-text password using Argon2id."""
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain-text password against its hash.
    Supports both Argon2 (new) and bcrypt (legacy) hashes.
    """
    if hashed_password.startswith("$argon2"):
        try:
            return ph.verify(hashed_password, plain_password)
        except (VerifyMismatchError, VerificationError):
            return False
    else:
        # Legacy bcrypt hash
        return _legacy_pwd_context.verify(plain_password, hashed_password)


def needs_rehash(hashed_password: str) -> bool:
    """Check if a password hash needs to be upgraded (e.g., bcrypt → Argon2)."""
    if not hashed_password.startswith("$argon2"):
        return True  # Legacy bcrypt hash
    return ph.check_needs_rehash(hashed_password)


# ── Password Validation ──────────────────────────────────────


def validate_password_strength(password: str) -> list[str]:
    """
    Validate password meets complexity requirements.
    Returns a list of failure reasons (empty = valid).
    """
    errors: list[str] = []
    min_len = settings.PASSWORD_MIN_LENGTH

    if len(password) < min_len:
        errors.append(f"Password must be at least {min_len} characters long")
    if not re.search(r"[A-Z]", password):
        errors.append("Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", password):
        errors.append("Password must contain at least one lowercase letter")
    if not re.search(r"\d", password):
        errors.append("Password must contain at least one digit")
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?]", password):
        errors.append("Password must contain at least one special character")

    return errors


# ── Token Generation ──────────────────────────────────────────


def _create_token(
    subject: str,
    token_type: str,
    expires_delta: timedelta,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    """Internal: create a JWT token with given claims including jti for revocation."""
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "jti": str(uuid.uuid4()),  # Unique token ID for revocation
        "iat": now,
        "exp": now + expires_delta,
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(
    user_id: str,
    organization_id: str | None = None,
    role_name: str | None = None,
) -> str:
    """Create a short-lived access token (15 minutes default)."""
    return _create_token(
        subject=user_id,
        token_type="access",
        expires_delta=timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
        extra_claims={
            "org_id": organization_id,
            "role": role_name,
        },
    )


def create_refresh_token(user_id: str) -> str:
    """Create a refresh token (1 day default)."""
    return _create_token(
        subject=user_id,
        token_type="refresh",
        expires_delta=timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
    )


# ── Token Decoding ────────────────────────────────────────────


class TokenPayload:
    """Decoded JWT payload."""

    def __init__(
        self,
        sub: str,
        token_type: str,
        jti: str,
        org_id: str | None,
        role: str | None,
        exp: datetime | None = None,
    ) -> None:
        self.sub = sub
        self.token_type = token_type
        self.jti = jti
        self.org_id = org_id
        self.role = role
        self.exp = exp


def decode_token(token: str) -> TokenPayload:
    """
    Decode and validate a JWT token.
    Raises JWTError on invalid or expired tokens.
    """
    payload = jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )
    exp_timestamp = payload.get("exp")
    exp_dt = datetime.fromtimestamp(exp_timestamp, tz=UTC) if exp_timestamp else None

    return TokenPayload(
        sub=payload["sub"],
        token_type=payload.get("type", "access"),
        jti=payload.get("jti", ""),
        org_id=payload.get("org_id"),
        role=payload.get("role"),
        exp=exp_dt,
    )


def decode_access_token(token: str) -> TokenPayload:
    """Decode and validate specifically an access token."""
    payload = decode_token(token)
    if payload.token_type != "access":
        raise JWTError("Invalid token type: expected access token")
    return payload


def decode_refresh_token(token: str) -> TokenPayload:
    """Decode and validate specifically a refresh token."""
    payload = decode_token(token)
    if payload.token_type != "refresh":
        raise JWTError("Invalid token type: expected refresh token")
    return payload
