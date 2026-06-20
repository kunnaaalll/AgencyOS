"""
AgencyOS V2 — Monitoring Schemas
"""

from pydantic import BaseModel

class SystemHealthResponse(BaseModel):
    postgres_health: bool
    redis_health: bool
    minio_health: bool
    meilisearch_health: bool
    queue_depth: int
    active_workers: int
    failed_jobs: int
    storage_usage: str
