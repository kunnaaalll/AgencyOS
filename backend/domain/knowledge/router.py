import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from domain.knowledge.schemas import (
    KnowledgeArticleCreate,
    KnowledgeArticleResponse,
    KnowledgeArticleUpdate,
    KnowledgeCategoryCreate,
    KnowledgeCategoryResponse,
    KnowledgeCategoryUpdate,
)
from domain.knowledge.services import KnowledgeService
from domain.role.dependencies import require_permissions
from domain.user.models import User

router = APIRouter(tags=["Knowledge OS"])

# ── Categories ─────────────────────────────────────────────────

@router.get("/v1/knowledge/categories", response_model=list[KnowledgeCategoryResponse])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["knowledge:read"]))
):
    return await KnowledgeService.get_categories(db)

@router.post("/v1/knowledge/categories", response_model=KnowledgeCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: KnowledgeCategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["knowledge:create"]))
):
    return await KnowledgeService.create_category(db, data)

@router.get("/v1/knowledge/categories/{id}", response_model=KnowledgeCategoryResponse)
async def get_category(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["knowledge:read"]))
):
    return await KnowledgeService.get_category(db, id)

@router.patch("/v1/knowledge/categories/{id}", response_model=KnowledgeCategoryResponse)
async def update_category(
    id: uuid.UUID,
    data: KnowledgeCategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["knowledge:update"]))
):
    return await KnowledgeService.update_category(db, id, data)

@router.delete("/v1/knowledge/categories/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["knowledge:delete"]))
):
    await KnowledgeService.delete_category(db, id)

# ── Articles ───────────────────────────────────────────────────

@router.get("/v1/knowledge/articles", response_model=list[KnowledgeArticleResponse])
async def list_articles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["knowledge:read"]))
):
    return await KnowledgeService.get_articles(db)

@router.post("/v1/knowledge/articles", response_model=KnowledgeArticleResponse, status_code=status.HTTP_201_CREATED)
async def create_article(
    data: KnowledgeArticleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["knowledge:create"]))
):
    return await KnowledgeService.create_article(db, data, current_user.id)

@router.get("/v1/knowledge/articles/{id}", response_model=KnowledgeArticleResponse)
async def get_article(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["knowledge:read"]))
):
    return await KnowledgeService.get_article(db, id)

@router.patch("/v1/knowledge/articles/{id}", response_model=KnowledgeArticleResponse)
async def update_article(
    id: uuid.UUID,
    data: KnowledgeArticleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["knowledge:update"]))
):
    return await KnowledgeService.update_article(db, id, data)

@router.delete("/v1/knowledge/articles/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_article(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["knowledge:delete"]))
):
    await KnowledgeService.delete_article(db, id)
