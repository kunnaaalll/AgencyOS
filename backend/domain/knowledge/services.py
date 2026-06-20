import uuid
from collections.abc import Sequence

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from domain.knowledge.models import KnowledgeArticle, KnowledgeCategory
from domain.knowledge.schemas import (
    KnowledgeArticleCreate,
    KnowledgeArticleUpdate,
    KnowledgeCategoryCreate,
    KnowledgeCategoryUpdate,
)


class KnowledgeService:
    # ── Categories ───────────────────────────────────────────────

    @staticmethod
    async def create_category(db: AsyncSession, data: KnowledgeCategoryCreate) -> KnowledgeCategory:
        category = KnowledgeCategory(**data.model_dump())
        db.add(category)
        await db.commit()
        await db.refresh(category)
        return category

    @staticmethod
    async def get_categories(db: AsyncSession) -> Sequence[KnowledgeCategory]:
        result = await db.execute(select(KnowledgeCategory).order_by(KnowledgeCategory.name))
        return result.scalars().all()

    @staticmethod
    async def get_category(db: AsyncSession, category_id: uuid.UUID) -> KnowledgeCategory:
        category = await db.get(KnowledgeCategory, category_id)
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        return category

    @staticmethod
    async def update_category(db: AsyncSession, category_id: uuid.UUID, data: KnowledgeCategoryUpdate) -> KnowledgeCategory:
        category = await KnowledgeService.get_category(db, category_id)
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(category, key, value)
        await db.commit()
        await db.refresh(category)
        return category

    @staticmethod
    async def delete_category(db: AsyncSession, category_id: uuid.UUID) -> None:
        category = await KnowledgeService.get_category(db, category_id)
        await db.delete(category)
        await db.commit()

    # ── Articles ─────────────────────────────────────────────────

    @staticmethod
    async def create_article(db: AsyncSession, data: KnowledgeArticleCreate, author_id: uuid.UUID) -> KnowledgeArticle:
        article = KnowledgeArticle(**data.model_dump(), author_id=author_id)
        db.add(article)
        await db.commit()
        await db.refresh(article)
        return article

    @staticmethod
    async def get_articles(db: AsyncSession) -> Sequence[KnowledgeArticle]:
        result = await db.execute(select(KnowledgeArticle).order_by(KnowledgeArticle.created_at.desc()))
        return result.scalars().all()

    @staticmethod
    async def get_article(db: AsyncSession, article_id: uuid.UUID) -> KnowledgeArticle:
        article = await db.get(KnowledgeArticle, article_id)
        if not article:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
        return article

    @staticmethod
    async def update_article(db: AsyncSession, article_id: uuid.UUID, data: KnowledgeArticleUpdate) -> KnowledgeArticle:
        article = await KnowledgeService.get_article(db, article_id)
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(article, key, value)
        await db.commit()
        await db.refresh(article)
        return article

    @staticmethod
    async def delete_article(db: AsyncSession, article_id: uuid.UUID) -> None:
        article = await KnowledgeService.get_article(db, article_id)
        await db.delete(article)
        await db.commit()
