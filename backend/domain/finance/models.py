import uuid
from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Numeric, String, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from domain.finance.enums import ExpenseStatus, RevenueStatus


class Revenue(Base):
    __tablename__ = "revenues"

    client_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("clients.id", ondelete="SET NULL"), nullable=True
    )
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    invoice_number: Mapped[str | None] = mapped_column(String(255), nullable=True)
    received_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    payment_method: Mapped[str | None] = mapped_column(String(255), nullable=True)

    status: Mapped[RevenueStatus] = mapped_column(
        SQLEnum(RevenueStatus, name="revenuestatus_enum"),
        default=RevenueStatus.PENDING,
        nullable=False,
    )

    client = relationship("Client")


class Expense(Base):
    __tablename__ = "expenses"

    category: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    vendor: Mapped[str | None] = mapped_column(String(255), nullable=True)
    expense_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    status: Mapped[ExpenseStatus] = mapped_column(
        SQLEnum(ExpenseStatus, name="expensestatus_enum"),
        default=ExpenseStatus.PENDING,
        nullable=False,
    )


class Founder(Base):
    __tablename__ = "founders"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    equity_percentage: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Distribution(Base):
    __tablename__ = "distributions"

    founder_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("founders.id", ondelete="CASCADE"), nullable=False
    )
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    distribution_date: Mapped[date] = mapped_column(Date, nullable=False)

    founder = relationship("Founder")


class FinanceSettings(Base):
    __tablename__ = "finance_settings"

    reserve_percentage: Mapped[float] = mapped_column(Numeric(5, 2), default=20.0, nullable=False)
