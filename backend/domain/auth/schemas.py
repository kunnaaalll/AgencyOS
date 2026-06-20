"""
AgencyOS V2.1 — Auth Pydantic Schemas
"""

from pydantic import BaseModel, EmailStr, Field, field_validator

from core.security import validate_password_strength


class LoginRequest(BaseModel):
    """Request body for POST /api/auth/login"""

    email: EmailStr
    password: str = Field(..., min_length=1)


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


class ChangePasswordRequest(BaseModel):
    """Request body for POST /api/auth/change-password"""

    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=12)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        errors = validate_password_strength(v)
        if errors:
            raise ValueError("; ".join(errors))
        return v


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
