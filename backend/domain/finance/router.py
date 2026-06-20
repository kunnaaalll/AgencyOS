import uuid
from typing import Sequence

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_active_user, require_any_permission
from core.database import get_db
from domain.user.models import User
from domain.finance.schemas import (
    RevenueCreate, RevenueUpdate, RevenueResponse,
    ExpenseCreate, ExpenseUpdate, ExpenseResponse,
    FounderCreate, FounderUpdate, FounderResponse,
    FinanceSummaryResponse, ForecastResponse
)
from domain.finance.services import FinanceService, DistributionService, ForecastService

router = APIRouter(prefix="/finance", tags=["finance"])

# -- Revenue --
@router.get(
    "/revenue",
    response_model=list[RevenueResponse],
    dependencies=[Depends(require_any_permission("finance:read", "Super Admin"))]
)
async def get_revenues(db: AsyncSession = Depends(get_db)):
    return await FinanceService.get_revenues(db)

@router.post(
    "/revenue",
    response_model=RevenueResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_any_permission("finance:create", "Super Admin"))]
)
async def create_revenue(data: RevenueCreate, db: AsyncSession = Depends(get_db)):
    return await FinanceService.create_revenue(db, data)

@router.patch(
    "/revenue/{revenue_id}",
    response_model=RevenueResponse,
    dependencies=[Depends(require_any_permission("finance:update", "Super Admin"))]
)
async def update_revenue(revenue_id: uuid.UUID, data: RevenueUpdate, db: AsyncSession = Depends(get_db)):
    return await FinanceService.update_revenue(db, revenue_id, data)

@router.delete(
    "/revenue/{revenue_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_any_permission("finance:delete", "Super Admin"))]
)
async def delete_revenue(revenue_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await FinanceService.delete_revenue(db, revenue_id)


# -- Expenses --
@router.get(
    "/expenses",
    response_model=list[ExpenseResponse],
    dependencies=[Depends(require_any_permission("finance:read", "Super Admin"))]
)
async def get_expenses(db: AsyncSession = Depends(get_db)):
    return await FinanceService.get_expenses(db)

@router.post(
    "/expenses",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_any_permission("finance:create", "Super Admin"))]
)
async def create_expense(data: ExpenseCreate, db: AsyncSession = Depends(get_db)):
    return await FinanceService.create_expense(db, data)

@router.patch(
    "/expenses/{expense_id}",
    response_model=ExpenseResponse,
    dependencies=[Depends(require_any_permission("finance:update", "Super Admin"))]
)
async def update_expense(expense_id: uuid.UUID, data: ExpenseUpdate, db: AsyncSession = Depends(get_db)):
    return await FinanceService.update_expense(db, expense_id, data)

@router.delete(
    "/expenses/{expense_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_any_permission("finance:delete", "Super Admin"))]
)
async def delete_expense(expense_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await FinanceService.delete_expense(db, expense_id)


# -- Founders --
@router.get(
    "/founders",
    response_model=list[FounderResponse],
    dependencies=[Depends(require_any_permission("finance:read", "Super Admin"))]
)
async def get_founders(db: AsyncSession = Depends(get_db)):
    return await DistributionService.get_founders(db)

@router.post(
    "/founders",
    response_model=FounderResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_any_permission("finance:create", "Super Admin"))]
)
async def create_founder(data: FounderCreate, db: AsyncSession = Depends(get_db)):
    return await DistributionService.create_founder(db, data)

@router.patch(
    "/founders/{founder_id}",
    response_model=FounderResponse,
    dependencies=[Depends(require_any_permission("finance:update", "Super Admin"))]
)
async def update_founder(founder_id: uuid.UUID, data: FounderUpdate, db: AsyncSession = Depends(get_db)):
    return await DistributionService.update_founder(db, founder_id, data)

@router.delete(
    "/founders/{founder_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_any_permission("finance:delete", "Super Admin"))]
)
async def delete_founder(founder_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await DistributionService.delete_founder(db, founder_id)


# -- Reports --
@router.get(
    "/summary",
    response_model=FinanceSummaryResponse,
    dependencies=[Depends(require_any_permission("finance:read", "reports:read", "Super Admin"))]
)
async def get_summary(db: AsyncSession = Depends(get_db)):
    return await FinanceService.get_summary(db)

@router.get(
    "/forecast",
    response_model=ForecastResponse,
    dependencies=[Depends(require_any_permission("finance:read", "reports:read", "Super Admin"))]
)
async def get_forecast(db: AsyncSession = Depends(get_db)):
    return await ForecastService.get_forecast(db)
