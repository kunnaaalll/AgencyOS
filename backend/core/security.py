"""
AgencyOS V2 — Security: JWT & Password Hashing
"""

from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from core.config import settings

# ── Password Hashing ──────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ── Token Generation ──────────────────────────────────────────

def _create_token(
    subject: str,
    token_type: str,
    expires_delta: timedelta,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    """Internal: create a JWT token with given claims."""
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
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
    """Create a short-lived access token."""
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
    """Create a long-lived refresh token."""
    return _create_token(
        subject=user_id,
        token_type="refresh",
        expires_delta=timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
    )


# ── Token Decoding ────────────────────────────────────────────

class TokenPayload:
    """Decoded JWT payload."""

    def __init__(self, sub: str, token_type: str, org_id: str | None, role: str | None) -> None:
        self.sub = sub
        self.token_type = token_type
        self.org_id = org_id
        self.role = role


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
    return TokenPayload(
        sub=payload["sub"],
        token_type=payload.get("type", "access"),
        org_id=payload.get("org_id"),
        role=payload.get("role"),
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
