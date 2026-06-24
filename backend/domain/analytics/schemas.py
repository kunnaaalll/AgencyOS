from pydantic import BaseModel


# Growth Metrics
class LeadFunnelData(BaseModel):
    stage: str
    count: int


class TrendData(BaseModel):
    date: str
    value: int


class GrowthMetricsResponse(BaseModel):
    total_leads: int
    qualified_leads: int
    lead_qualification_rate: float
    meetings_scheduled: int
    proposal_count: int
    win_rate: float
    new_clients_this_month: int
    churn_rate: float
    active_clients: int

    lead_funnel: list[LeadFunnelData]
    lead_qualification_trend: list[TrendData]
    client_growth_trend: list[TrendData]


# Revenue Metrics
class FinancialTrendData(BaseModel):
    date: str
    revenue: float
    expense: float
    profit: float
    mrr: float


class RevenueMetricsResponse(BaseModel):
    mrr: float
    arr: float
    revenue_growth_percentage: float
    profit_growth_percentage: float
    average_revenue_per_client: float
    lifetime_revenue: float

    financial_trend: list[FinancialTrendData]


# Sales Metrics
class DistributionData(BaseModel):
    name: str
    value: float


class WinLossData(BaseModel):
    name: str
    value: int


class SalesMetricsResponse(BaseModel):
    pipeline_value: float
    weighted_pipeline_value: float
    average_deal_size: float
    sales_conversion_rate: float
    average_sales_cycle_days: float

    pipeline_stage_distribution: list[DistributionData]
    win_loss_ratio: list[WinLossData]
    deal_size_distribution: list[DistributionData]


# Delivery Metrics
class DeliveryMetricsResponse(BaseModel):
    open_tasks: int
    completed_tasks: int
    project_completion_rate: float
    renewals_due: int

    task_status_distribution: list[DistributionData]
    client_health_distribution: list[DistributionData]
    project_status_distribution: list[DistributionData]


# Forecast Metrics
class ForecastResponse(BaseModel):
    projected_mrr: float
    projected_profit: float
    projected_clients: int
    hiring_recommendation: bool
    hiring_reason: str | None = None


# Executive Summary
class ExecutiveSummaryResponse(BaseModel):
    growth: GrowthMetricsResponse
    sales: SalesMetricsResponse
    finance: RevenueMetricsResponse
    delivery: DeliveryMetricsResponse
    forecast: ForecastResponse
