"""
AgencyOS V2.1 — Health Endpoint Tests
"""

import pytest
from httpx import AsyncClient


class TestHealth:
    """GET /api/health"""

    @pytest.mark.asyncio
    async def test_health_check_returns_status(self, client: AsyncClient):
        response = await client.get("/api/v1/health")
        # May return 200 (healthy) or 503 (degraded) depending on service availability
        assert response.status_code in (200, 503)
        data = response.json()
        assert "status" in data
        assert "services" in data
        assert isinstance(data["services"], list)

    @pytest.mark.asyncio
    async def test_root_endpoint(self, client: AsyncClient):
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "AgencyOS V2 API"
