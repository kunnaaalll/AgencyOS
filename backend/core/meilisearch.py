"""
AgencyOS V2 — Meilisearch Client Factory
"""

import meilisearch
from meilisearch import Client

from core.config import settings

_client: Client | None = None


def get_meilisearch_client() -> Client:
    """Get or create Meilisearch client (singleton)."""
    global _client
    if _client is None:
        _client = meilisearch.Client(
            url=settings.MEILISEARCH_URL,
            api_key=settings.MEILISEARCH_MASTER_KEY,
        )
    return _client


async def check_meilisearch_connection() -> bool:
    """Health check: verify Meilisearch connectivity."""
    try:
        client = get_meilisearch_client()
        health = client.health()
        return health.get("status") == "available"
    except Exception:
        return False
