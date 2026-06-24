import uuid
from datetime import datetime

from pydantic import BaseModel

from domain.documents.enums import DocumentType

# ── Documents ──────────────────────────────────────────────────


class DocumentCreate(BaseModel):
    name: str
    client_id: uuid.UUID | None = None
    document_type: DocumentType = DocumentType.GENERAL


class DocumentResponse(BaseModel):
    id: uuid.UUID
    name: str
    original_filename: str
    mime_type: str
    size: int
    bucket: str
    storage_key: str
    document_type: DocumentType
    client_id: uuid.UUID | None = None
    uploaded_by: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Credentials ────────────────────────────────────────────────


class CredentialRecordCreate(BaseModel):
    provider: str
    client_id: uuid.UUID | None = None
    account_email: str | None = None
    notes: str | None = None


class CredentialRecordUpdate(BaseModel):
    provider: str | None = None
    account_email: str | None = None
    notes: str | None = None
    last_verified_at: datetime | None = None


class CredentialRecordResponse(BaseModel):
    id: uuid.UUID
    provider: str
    client_id: uuid.UUID | None = None
    account_email: str | None = None
    notes: str | None = None
    last_verified_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
