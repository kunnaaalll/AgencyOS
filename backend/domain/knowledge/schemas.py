import uuid
from datetime import datetime

from pydantic import BaseModel

from domain.knowledge.enums import KnowledgeStatus

# ── Category ───────────────────────────────────────────────────


class KnowledgeCategoryCreate(BaseModel):
    name: str
    description: str | None = None
    color: str | None = None


class KnowledgeCategoryUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    color: str | None = None


class KnowledgeCategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    color: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Article ────────────────────────────────────────────────────


class KnowledgeArticleCreate(BaseModel):
    title: str
    slug: str
    category_id: uuid.UUID | None = None
    content: str
    tags: list[str] | None = None
    status: KnowledgeStatus = KnowledgeStatus.DRAFT


class KnowledgeArticleUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    category_id: uuid.UUID | None = None
    content: str | None = None
    tags: list[str] | None = None
    status: KnowledgeStatus | None = None


class KnowledgeArticleResponse(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    category_id: uuid.UUID | None = None
    content: str
    tags: list[str] | None = None
    status: KnowledgeStatus
    author_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
