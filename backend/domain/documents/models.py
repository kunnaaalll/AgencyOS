import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, Enum as SQLEnum, Text, DateTime, BigInteger
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base
from domain.documents.enums import DocumentType

class Document(Base):
    __tablename__ = "documents"

    client_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("clients.id", ondelete="SET NULL"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    bucket: Mapped[str] = mapped_column(String(100), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    document_type: Mapped[DocumentType] = mapped_column(SQLEnum(DocumentType), nullable=False, default=DocumentType.GENERAL)
    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

class CredentialRecord(Base):
    __tablename__ = "credentials"

    client_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"), nullable=True, index=True)
    provider: Mapped[str] = mapped_column(String(100), nullable=False)
    account_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
