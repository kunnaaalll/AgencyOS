
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import require_roles
from core.database import get_db
from domain.analytics.schemas import (
    DeliveryMetricsResponse,
    ExecutiveSummaryResponse,
    ForecastResponse,
    GrowthMetricsResponse,
    RevenueMetricsResponse,
    SalesMetricsResponse,
)
from domain.analytics.services import AnalyticsService

# All founders can read analytics. The dashboard should be accessible to those with proper access.
# If there is a permission "analytics:read", we can use AuthGuard.require_permissions(["analytics:read"])
# or just allow Founder and Super Admin. Let's use require_roles to allow FOUNDER and SUPER_ADMIN.
router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/executive-summary", response_model=ExecutiveSummaryResponse)
async def get_executive_summary(
    db: AsyncSession = Depends(get_db),
    user = Depends(require_roles(["Super Admin", "Founder"]))
):
    return await AnalyticsService.get_executive_summary(db)

@router.get("/growth", response_model=GrowthMetricsResponse)
async def get_growth_metrics(
    db: AsyncSession = Depends(get_db),
    user = Depends(require_roles(["Super Admin", "Founder"]))
):
    return await AnalyticsService.get_growth_metrics(db)

@router.get("/sales", response_model=SalesMetricsResponse)
async def get_sales_metrics(
    db: AsyncSession = Depends(get_db),
    user = Depends(require_roles(["Super Admin", "Founder"]))
):
    return await AnalyticsService.get_sales_metrics(db)

@router.get("/finance", response_model=RevenueMetricsResponse)
async def get_finance_metrics(
    db: AsyncSession = Depends(get_db),
    user = Depends(require_roles(["Super Admin", "Founder"]))
):
    return await AnalyticsService.get_revenue_metrics(db)

@router.get("/delivery", response_model=DeliveryMetricsResponse)
async def get_delivery_metrics(
    db: AsyncSession = Depends(get_db),
    user = Depends(require_roles(["Super Admin", "Founder"]))
):
    return await AnalyticsService.get_delivery_metrics(db)

@router.get("/forecast", response_model=ForecastResponse)
async def get_forecast(
    db: AsyncSession = Depends(get_db),
    user = Depends(require_roles(["Super Admin", "Founder"]))
):
    return await AnalyticsService.get_forecast(db)
