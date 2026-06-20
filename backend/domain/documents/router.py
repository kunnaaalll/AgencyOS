import uuid
from typing import List
from fastapi import APIRouter, Depends, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.security import get_current_user
from domain.user.models import User
from domain.role.dependencies import require_permissions
from domain.documents.schemas import (
    DocumentResponse, 
    DocumentCreate, 
    CredentialRecordCreate, 
    CredentialRecordResponse, 
    CredentialRecordUpdate
)
from domain.documents.services import DocumentService, CredentialService
from domain.documents.enums import DocumentType

router = APIRouter(tags=["Documents & Credentials"])

# ── Documents ──────────────────────────────────────────────────

@router.get("/v1/documents", response_model=List[DocumentResponse])
async def list_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["documents:read"]))
):
    return await DocumentService.get_documents(db)

@router.post("/v1/documents/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    name: str = Form(...),
    client_id: uuid.UUID = Form(None),
    document_type: DocumentType = Form(DocumentType.GENERAL),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["documents:create"]))
):
    metadata = DocumentCreate(
        name=name,
        client_id=client_id,
        document_type=document_type
    )
    return await DocumentService.upload_document(db, file, metadata, current_user.id)

@router.get("/v1/documents/{id}", response_model=DocumentResponse)
async def get_document(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["documents:read"]))
):
    return await DocumentService.get_document(db, id)

@router.delete("/v1/documents/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["documents:delete"]))
):
    await DocumentService.delete_document(db, id)

@router.get("/v1/documents/{id}/download")
async def download_document(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["documents:read"]))
):
    url = await DocumentService.get_download_url(db, id)
    return {"url": url}

# ── Credentials ────────────────────────────────────────────────

@router.get("/v1/credentials", response_model=List[CredentialRecordResponse])
async def list_credentials(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["documents:read"]))
):
    return await CredentialService.get_credentials(db)

@router.post("/v1/credentials", response_model=CredentialRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_credential(
    data: CredentialRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["documents:create"]))
):
    return await CredentialService.create_credential(db, data)

@router.patch("/v1/credentials/{id}", response_model=CredentialRecordResponse)
async def update_credential(
    id: uuid.UUID,
    data: CredentialRecordUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["documents:create"]))
):
    return await CredentialService.update_credential(db, id, data)

@router.delete("/v1/credentials/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_credential(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["documents:delete"]))
):
    await CredentialService.delete_credential(db, id)
