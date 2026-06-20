from pydantic import BaseModel
from datetime import datetime
import uuid
from typing import Optional, List

from domain.knowledge.enums import KnowledgeStatus

# ── Category ───────────────────────────────────────────────────

class KnowledgeCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = None

class KnowledgeCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None

class KnowledgeCategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ── Article ────────────────────────────────────────────────────

class KnowledgeArticleCreate(BaseModel):
    title: str
    slug: str
    category_id: Optional[uuid.UUID] = None
    content: str
    tags: Optional[List[str]] = None
    status: KnowledgeStatus = KnowledgeStatus.DRAFT

class KnowledgeArticleUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[KnowledgeStatus] = None

class KnowledgeArticleResponse(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    category_id: Optional[uuid.UUID] = None
    content: str
    tags: Optional[List[str]] = None
    status: KnowledgeStatus
    author_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
