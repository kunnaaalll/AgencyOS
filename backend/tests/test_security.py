"""
AgencyOS V2.1 — Security Tests
Tests for rate limiting, CORS, security headers, and token validation.
"""

import pytest
from httpx import AsyncClient

from core.security import hash_password, validate_password_strength, verify_password


class TestPasswordHashing:
    """Test Argon2 password hashing."""

    def test_hash_and_verify(self):
        password = "SecurePassword123!"
        hashed = hash_password(password)
        assert hashed.startswith("$argon2")
        assert verify_password(password, hashed)

    def test_wrong_password_fails(self):
        hashed = hash_password("SecurePassword123!")
        assert not verify_password("WrongPassword!", hashed)

    def test_different_hashes_for_same_password(self):
        password = "SecurePassword123!"
        hash1 = hash_password(password)
        hash2 = hash_password(password)
        assert hash1 != hash2  # Different salts


class TestPasswordValidation:
    """Test password complexity requirements."""

    def test_valid_password(self):
        errors = validate_password_strength("SecurePass123!")
        assert errors == []

    def test_too_short(self):
        errors = validate_password_strength("Short1!")
        assert any("12 characters" in e for e in errors)

    def test_no_uppercase(self):
        errors = validate_password_strength("securepass123!")
        assert any("uppercase" in e for e in errors)

    def test_no_lowercase(self):
        errors = validate_password_strength("SECUREPASS123!")
        assert any("lowercase" in e for e in errors)

    def test_no_digit(self):
        errors = validate_password_strength("SecurePassword!")
        assert any("digit" in e for e in errors)

    def test_no_special_char(self):
        errors = validate_password_strength("SecurePassword1")
        assert any("special" in e for e in errors)


class TestSecurityHeaders:
    """Test that security headers are present in responses."""

    @pytest.mark.asyncio
    async def test_security_headers_present(self, client: AsyncClient):
        response = await client.get("/")
        headers = response.headers

        assert headers.get("x-content-type-options") == "nosniff"
        assert headers.get("x-frame-options") == "DENY"
        assert headers.get("referrer-policy") == "strict-origin-when-cross-origin"

    @pytest.mark.asyncio
    async def test_request_id_header(self, client: AsyncClient):
        response = await client.get("/")
        assert "x-request-id" in response.headers


class TestCORS:
    """Test CORS configuration."""

    @pytest.mark.asyncio
    async def test_cors_allowed_origin(self, client: AsyncClient):
        response = await client.options(
            "/api/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_cors_disallowed_origin(self, client: AsyncClient):
        response = await client.options(
            "/api/health",
            headers={
                "Origin": "http://evil.com",
                "Access-Control-Request-Method": "GET",
            },
        )
        # Should not have Access-Control-Allow-Origin for evil.com
        allow_origin = response.headers.get("access-control-allow-origin", "")
        assert "evil.com" not in allow_origin


class TestUnauthorizedAccess:
    """Test that protected endpoints require authentication."""

    @pytest.mark.asyncio
    async def test_protected_endpoint_no_token(self, client: AsyncClient):
        response = await client.get("/api/auth/me")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_protected_endpoint_invalid_token(self, client: AsyncClient):
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid.token.here"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_protected_endpoint_expired_token(self, client: AsyncClient):
        # An expired token should return 401
        from datetime import timedelta

        from core.security import _create_token

        expired_token = _create_token(
            subject="fake-user-id",
            token_type="access",
            expires_delta=timedelta(seconds=-1),
        )
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {expired_token}"},
        )
        assert response.status_code == 401
