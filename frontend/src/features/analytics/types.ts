export interface LeadFunnelData {
  stage: string
  count: number
}

export interface TrendData {
  date: string
  value: number
}

export interface FinancialTrendData {
  date: string
  revenue: number
  expense: number
  profit: number
  mrr: number
}

export interface DistributionData {
  name: string
  value: number
}

export interface WinLossData {
  name: string
  value: number
}

export interface GrowthMetricsResponse {
  total_leads: number
  qualified_leads: number
  lead_qualification_rate: number
  meetings_scheduled: number
  proposal_count: number
  win_rate: number
  new_clients_this_month: number
  churn_rate: number
  active_clients: number
  
  lead_funnel: LeadFunnelData[]
  lead_qualification_trend: TrendData[]
  client_growth_trend: TrendData[]
}

export interface RevenueMetricsResponse {
  mrr: number
  arr: number
  revenue_growth_percentage: number
  profit_growth_percentage: number
  average_revenue_per_client: number
  lifetime_revenue: number
  
  financial_trend: FinancialTrendData[]
}

export interface SalesMetricsResponse {
  pipeline_value: number
  weighted_pipeline_value: number
  average_deal_size: number
  sales_conversion_rate: number
  average_sales_cycle_days: number
  
  pipeline_stage_distribution: DistributionData[]
  win_loss_ratio: WinLossData[]
  deal_size_distribution: DistributionData[]
}

export interface DeliveryMetricsResponse {
  open_tasks: number
  completed_tasks: number
  project_completion_rate: number
  renewals_due: number
  
  task_status_distribution: DistributionData[]
  client_health_distribution: DistributionData[]
  project_status_distribution: DistributionData[]
}

export interface ForecastResponse {
  projected_mrr: number
  projected_profit: number
  projected_clients: number
  hiring_recommendation: boolean
  hiring_reason: string | null
}

export interface ExecutiveSummaryResponse {
  growth: GrowthMetricsResponse
  sales: SalesMetricsResponse
  finance: RevenueMetricsResponse
  delivery: DeliveryMetricsResponse
  forecast: ForecastResponse
}
