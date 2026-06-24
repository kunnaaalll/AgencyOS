from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field

from domain.finance.enums import ExpenseStatus, RevenueStatus


# -- Revenue Schemas --
class RevenueBase(BaseModel):
    client_id: UUID | None = None
    amount: float = Field(..., gt=0)
    currency: str = "USD"
    description: str | None = None
    invoice_number: str | None = None
    received_date: date | None = None
    payment_method: str | None = None
    status: RevenueStatus = RevenueStatus.PENDING

class RevenueCreate(RevenueBase):
    pass

class RevenueUpdate(BaseModel):
    client_id: UUID | None = None
    amount: float | None = Field(None, gt=0)
    currency: str | None = None
    description: str | None = None
    invoice_number: str | None = None
    received_date: date | None = None
    payment_method: str | None = None
    status: RevenueStatus | None = None

class RevenueResponse(RevenueBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# -- Expense Schemas --
from pydantic import AliasChoices, BaseModel, Field


class ExpenseBase(BaseModel):
    category: str
    amount: float = Field(..., gt=0)
    currency: str = "USD"
    description: str | None = Field(None, validation_alias=AliasChoices("description", "title", "name"))
    vendor: str | None = Field(None, validation_alias=AliasChoices("vendor", "merchant"))
    expense_date: date | None = Field(None, validation_alias=AliasChoices("expense_date", "date"))
    status: ExpenseStatus = ExpenseStatus.PENDING

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    category: str | None = None
    amount: float | None = Field(None, gt=0)
    currency: str | None = None
    description: str | None = None
    vendor: str | None = None
    expense_date: date | None = None
    status: ExpenseStatus | None = None

class ExpenseResponse(ExpenseBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# -- Founder Schemas --
class FounderBase(BaseModel):
    name: str
    email: str
    equity_percentage: float = Field(..., ge=0, le=100)
    is_active: bool = True

class FounderCreate(FounderBase):
    pass

class FounderUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    equity_percentage: float | None = Field(None, ge=0, le=100)
    is_active: bool | None = None

class FounderResponse(FounderBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# -- Distribution Schemas --
class DistributionBase(BaseModel):
    founder_id: UUID
    period_start: date
    period_end: date
    amount: float
    distribution_date: date

class DistributionResponse(DistributionBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# -- Finance Settings Schemas --
class FinanceSettingsBase(BaseModel):
    reserve_percentage: float = Field(..., ge=0, le=100)

class FinanceSettingsUpdate(BaseModel):
    reserve_percentage: float = Field(..., ge=0, le=100)

class FinanceSettingsResponse(FinanceSettingsBase):
    id: UUID

    class Config:
        from_attributes = True

# -- Summary Schemas --
class FinanceSummaryResponse(BaseModel):
    mrr: float
    total_revenue: float
    total_expenses: float
    net_profit: float
    reserve_fund: float
    distribution_pool: float

class ForecastResponse(BaseModel):
    projected_mrr: float
    projected_profit: float
    hiring_affordability: float
