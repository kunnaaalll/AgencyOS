import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


# ── Discovery Run ─────────────────────────────────────────────────────────────

class DiscoveryRunCreate(BaseModel):
    source: str
    query: str | None = None
    location: str | None = None
    limit: int = 10


class DiscoveryRunResponse(BaseModel):
    id: uuid.UUID
    source: str
    status: str
    query: str | None
    location: str | None
    started_at: datetime | None
    completed_at: datetime | None
    businesses_discovered: int
    businesses_validated: int
    businesses_created: int
    error_message: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ── Bulk Discovery Job ────────────────────────────────────────────────────────

class BulkDiscoveryRequest(BaseModel):
    industries: list[str]
    locations: list[str]
    sources: list[str]
    limit_per_query: int = 10


class BulkDiscoveryResponse(BaseModel):
    id: uuid.UUID
    status: str
    industries: list
    locations: list
    sources: list
    limit_per_query: int
    total_queries: int
    completed_queries: int
    failed_queries: int
    businesses_discovered: int
    error_message: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ── Raw Business ──────────────────────────────────────────────────────────────

class RawBusinessResponse(BaseModel):
    id: uuid.UUID
    source: str
    business_name: str
    website: str | None
    phone: str | None
    email: str | None
    address: str | None
    city: str | None
    state: str | None
    country: str | None
    industry: str | None
    rating: float | None
    google_rating: float | None
    review_count: int | None
    google_maps_url: str | None
    instagram_url: str | None
    facebook_url: str | None
    linkedin_url: str | None
    youtube_url: str | None
    meta_title: str | None
    meta_description: str | None
    completeness_score: int
    validation_status: str
    is_duplicate: bool
    enriched_at: datetime | None
    raw_payload: dict
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ── Metrics ───────────────────────────────────────────────────────────────────

class DailyDiscoveryCount(BaseModel):
    date: str
    count: int


class SourceStat(BaseModel):
    source: str
    total: int
    valid: int
    invalid: int
    duplicates: int
    success_rate: float
    avg_runtime_seconds: float


class TopItem(BaseModel):
    name: str
    count: int


class DiscoveryMetricsResponse(BaseModel):
    total_discovered: int
    total_validated: int
    total_promoted: int
    validation_success_rate: float
    duplicate_rate: float
    promotion_rate: float
    businesses_per_hour: float
    daily_counts: list[DailyDiscoveryCount]
    top_industries: list[TopItem]
    top_locations: list[TopItem]
    source_stats: list[SourceStat]


# ── Business Filters ──────────────────────────────────────────────────────────

class BusinessFilters(BaseModel):
    status: str | None = None
    source: str | None = None
    industry: str | None = None
    city: str | None = None
    min_completeness: int | None = None
    is_duplicate: bool | None = None
    page: int = 1
    limit: int = 50


class PaginatedBusinessesResponse(BaseModel):
    items: list[RawBusinessResponse]
    total: int
    page: int
    limit: int
    pages: int
