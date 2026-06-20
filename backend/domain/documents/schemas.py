from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
import uuid
from typing import Optional

from domain.documents.enums import DocumentType

# ── Documents ──────────────────────────────────────────────────

class DocumentCreate(BaseModel):
    name: str
    client_id: Optional[uuid.UUID] = None
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
    client_id: Optional[uuid.UUID] = None
    uploaded_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ── Credentials ────────────────────────────────────────────────

class CredentialRecordCreate(BaseModel):
    provider: str
    client_id: Optional[uuid.UUID] = None
    account_email: Optional[str] = None
    notes: Optional[str] = None

class CredentialRecordUpdate(BaseModel):
    provider: Optional[str] = None
    account_email: Optional[str] = None
    notes: Optional[str] = None
    last_verified_at: Optional[datetime] = None

class CredentialRecordResponse(BaseModel):
    id: uuid.UUID
    provider: str
    client_id: Optional[uuid.UUID] = None
    account_email: Optional[str] = None
    notes: Optional[str] = None
    last_verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
