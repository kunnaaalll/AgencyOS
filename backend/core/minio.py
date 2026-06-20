"""
AgencyOS V2 — MinIO Client Factory
"""

from minio import Minio
from minio.error import S3Error

from core.config import settings

_client: Minio | None = None


def get_minio_client() -> Minio:
    """Get or create MinIO client (singleton)."""
    global _client
    if _client is None:
        _client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
    return _client


async def ensure_bucket_exists(bucket_name: str | None = None) -> None:
    """Ensure the default bucket exists, creating it if necessary."""
    client = get_minio_client()
    name = bucket_name or settings.MINIO_BUCKET_NAME
    if not client.bucket_exists(name):
        client.make_bucket(name)


async def check_minio_connection() -> bool:
    """Health check: verify MinIO connectivity."""
    try:
        client = get_minio_client()
        # list_buckets is a lightweight connectivity check
        client.list_buckets()
        return True
    except (S3Error, Exception):
        return False
