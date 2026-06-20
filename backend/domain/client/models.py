import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, Enum as SQLEnum, Text, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from domain.client.enums import ClientStatus, HealthStatus

class Client(Base):
    __tablename__ = "clients"

    opportunity_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("opportunities.id", ondelete="SET NULL"), nullable=True)
    business_name: Mapped[str] = mapped_column(String(255), nullable=False)
    primary_contact_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    primary_contact_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    primary_contact_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    package_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    monthly_retainer: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    contract_start_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    contract_end_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    status: Mapped[ClientStatus] = mapped_column(
        SQLEnum(ClientStatus, name="clientstatus_enum"), default=ClientStatus.ACTIVE, nullable=False
    )
    health_status: Mapped[HealthStatus] = mapped_column(
        SQLEnum(HealthStatus, name="healthstatus_enum"), default=HealthStatus.HEALTHY, nullable=False
    )
    renewal_probability: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    opportunity = relationship("Opportunity")
    projects: Mapped[list["Project"]] = relationship("Project", back_populates="client", cascade="all, delete-orphan") # type: ignore
