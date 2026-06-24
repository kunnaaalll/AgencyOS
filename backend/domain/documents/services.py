import uuid
from collections.abc import Sequence

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from domain.documents.models import CredentialRecord, Document
from domain.documents.schemas import CredentialRecordCreate, CredentialRecordUpdate, DocumentCreate
from domain.documents.storage import StorageService


class DocumentService:
    @staticmethod
    async def upload_document(
        db: AsyncSession, file: UploadFile, metadata: DocumentCreate, user_id: uuid.UUID
    ) -> Document:
        # Upload to MinIO
        storage_key = await StorageService.upload_file(
            file, bucket=settings.MINIO_BUCKET_NAME, prefix="documents/"
        )

        # Create database record
        doc = Document(
            name=metadata.name,
            client_id=metadata.client_id,
            document_type=metadata.document_type,
            original_filename=file.filename or "unknown",
            mime_type=file.content_type or "application/octet-stream",
            size=file.size or 0,
            bucket=settings.MINIO_BUCKET_NAME,
            storage_key=storage_key,
            uploaded_by=user_id,
        )
        db.add(doc)
        await db.commit()
        await db.refresh(doc)
        return doc

    @staticmethod
    async def get_documents(db: AsyncSession) -> Sequence[Document]:
        result = await db.execute(select(Document).order_by(Document.created_at.desc()))
        return result.scalars().all()

    @staticmethod
    async def get_document(db: AsyncSession, document_id: uuid.UUID) -> Document:
        doc = await db.get(Document, document_id)
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        return doc

    @staticmethod
    async def delete_document(db: AsyncSession, document_id: uuid.UUID) -> None:
        doc = await DocumentService.get_document(db, document_id)

        # Delete from MinIO
        await StorageService.delete_file(doc.storage_key, bucket=doc.bucket)

        # Delete from DB
        await db.delete(doc)
        await db.commit()

    @staticmethod
    async def get_download_url(db: AsyncSession, document_id: uuid.UUID) -> str:
        doc = await DocumentService.get_document(db, document_id)
        url = await StorageService.generate_presigned_url(doc.storage_key, bucket=doc.bucket)
        return url


class CredentialService:
    @staticmethod
    async def create_credential(db: AsyncSession, data: CredentialRecordCreate) -> CredentialRecord:
        cred = CredentialRecord(**data.model_dump())
        db.add(cred)
        await db.commit()
        await db.refresh(cred)
        return cred

    @staticmethod
    async def get_credentials(db: AsyncSession) -> Sequence[CredentialRecord]:
        result = await db.execute(
            select(CredentialRecord).order_by(CredentialRecord.created_at.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def get_credential(db: AsyncSession, cred_id: uuid.UUID) -> CredentialRecord:
        cred = await db.get(CredentialRecord, cred_id)
        if not cred:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Credential not found"
            )
        return cred

    @staticmethod
    async def update_credential(
        db: AsyncSession, cred_id: uuid.UUID, data: CredentialRecordUpdate
    ) -> CredentialRecord:
        cred = await CredentialService.get_credential(db, cred_id)
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(cred, key, value)
        await db.commit()
        await db.refresh(cred)
        return cred

    @staticmethod
    async def delete_credential(db: AsyncSession, cred_id: uuid.UUID) -> None:
        cred = await CredentialService.get_credential(db, cred_id)
        await db.delete(cred)
        await db.commit()
