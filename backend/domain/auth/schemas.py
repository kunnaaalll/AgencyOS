"""
AgencyOS V2 — Auth Pydantic Schemas
"""

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Request body for POST /api/auth/login"""

    email: EmailStr
    password: str = Field(..., min_length=8)


class TokenResponse(BaseModel):
    """Returned on successful login or token refresh."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds until access token expiry


class RefreshRequest(BaseModel):
    """Request body for POST /api/auth/refresh"""

    refresh_token: str


class LogoutRequest(BaseModel):
    """Request body for POST /api/auth/logout"""

    refresh_token: str


class MeResponse(BaseModel):
    """Current authenticated user info."""

    id: str
    email: str
    first_name: str
    last_name: str
    full_name: str
    is_active: bool
    organization_id: str | None = None
    role_name: str | None = None

    model_config = {"from_attributes": True}
