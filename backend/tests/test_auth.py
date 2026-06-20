"""
AgencyOS V2.1 — Auth Tests
Tests for login, refresh, logout, lockout, password change, and token revocation.
"""

import pytest
from httpx import AsyncClient


class TestLogin:
    """POST /api/auth/login"""

    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient, test_user):
        response = await client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "TestPassword123!"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["expires_in"] > 0

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client: AsyncClient, test_user):
        response = await client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "WrongPassword123!"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, client: AsyncClient):
        response = await client.post(
            "/api/auth/login",
            json={"email": "nobody@example.com", "password": "TestPassword123!"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_login_invalid_email_format(self, client: AsyncClient):
        response = await client.post(
            "/api/auth/login",
            json={"email": "not-an-email", "password": "TestPassword123!"},
        )
        assert response.status_code == 422


class TestRefresh:
    """POST /api/auth/refresh"""

    @pytest.mark.asyncio
    async def test_refresh_success(self, client: AsyncClient, test_user):
        # Login first
        login_resp = await client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "TestPassword123!"},
        )
        refresh_token = login_resp.json()["refresh_token"]

        # Refresh
        response = await client.post(
            "/api/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    @pytest.mark.asyncio
    async def test_refresh_invalid_token(self, client: AsyncClient):
        response = await client.post(
            "/api/auth/refresh",
            json={"refresh_token": "invalid.token.here"},
        )
        assert response.status_code == 401


class TestLogout:
    """POST /api/auth/logout"""

    @pytest.mark.asyncio
    async def test_logout_success(self, client: AsyncClient, test_user):
        login_resp = await client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "TestPassword123!"},
        )
        refresh_token = login_resp.json()["refresh_token"]

        response = await client.post(
            "/api/auth/logout",
            json={"refresh_token": refresh_token},
        )
        assert response.status_code == 204


class TestMe:
    """GET /api/auth/me"""

    @pytest.mark.asyncio
    async def test_me_authenticated(self, client: AsyncClient, auth_headers):
        response = await client.get("/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["first_name"] == "Test"
        assert data["is_active"] is True

    @pytest.mark.asyncio
    async def test_me_unauthenticated(self, client: AsyncClient):
        response = await client.get("/api/auth/me")
        assert response.status_code == 401


class TestChangePassword:
    """POST /api/auth/change-password"""

    @pytest.mark.asyncio
    async def test_change_password_success(self, client: AsyncClient, auth_headers):
        response = await client.post(
            "/api/auth/change-password",
            json={
                "current_password": "TestPassword123!",
                "new_password": "NewSecurePass456!",
            },
            headers=auth_headers,
        )
        assert response.status_code == 204

    @pytest.mark.asyncio
    async def test_change_password_wrong_current(self, client: AsyncClient, auth_headers):
        response = await client.post(
            "/api/auth/change-password",
            json={
                "current_password": "WrongPassword!",
                "new_password": "NewSecurePass456!",
            },
            headers=auth_headers,
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_change_password_weak_new(self, client: AsyncClient, auth_headers):
        response = await client.post(
            "/api/auth/change-password",
            json={
                "current_password": "TestPassword123!",
                "new_password": "weak",
            },
            headers=auth_headers,
        )
        assert response.status_code == 422
