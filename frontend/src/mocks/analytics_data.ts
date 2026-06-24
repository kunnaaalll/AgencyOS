import { 
  SalesMetricsResponse, 
  DeliveryMetricsResponse, 
  ForecastResponse,
  ExecutiveSummaryResponse 
} from '../features/analytics/types';
import { mockGrowthData } from './growth';

export const mockSalesData: SalesMetricsResponse = {
  pipeline_value: 845000,
  weighted_pipeline_value: 320000,
  average_deal_size: 45000,
  sales_conversion_rate: 22.5,
  average_sales_cycle_days: 14,
  pipeline_stage_distribution: [
    { name: 'Discovery', value: 45 },
    { name: 'Qualified', value: 30 },
    { name: 'Proposal', value: 15 },
    { name: 'Negotiation', value: 8 },
    { name: 'Closed', value: 5 }
  ],
  win_loss_ratio: [
    { name: 'Won', value: 18 },
    { name: 'Lost', value: 24 }
  ],
  deal_size_distribution: [
    { name: '< 10k', value: 5 },
    { name: '10k - 50k', value: 20 },
    { name: '> 50k', value: 10 }
  ]
};

export const mockDeliveryData: DeliveryMetricsResponse = {
  open_tasks: 120,
  completed_tasks: 450,
  project_completion_rate: 85,
  renewals_due: 4,
  task_status_distribution: [
    { name: 'To Do', value: 45 },
    { name: 'In Progress', value: 30 },
    { name: 'Review', value: 20 },
    { name: 'Done', value: 150 }
  ],
  client_health_distribution: [
    { name: 'Healthy', value: 35 },
    { name: 'At Risk', value: 5 },
    { name: 'Needs Attention', value: 2 }
  ],
  project_status_distribution: [
    { name: 'On Track', value: 18 },
    { name: 'Delayed', value: 3 },
    { name: 'Blocked', value: 1 }
  ]
};

export const mockForecastData: ForecastResponse = {
  projected_mrr: 145000,
  projected_profit: 85000,
  projected_clients: 48,
  hiring_recommendation: true,
  hiring_reason: 'Client workload exceeds current capacity thresholds by 15%.'
};

export const mockExecutiveSummary: ExecutiveSummaryResponse = {
  growth: mockGrowthData,
  sales: mockSalesData,
  finance: {
    mrr: 124500,
    arr: 1494000,
    revenue_growth_percentage: 14.2,
    profit_growth_percentage: 12.5,
    average_revenue_per_client: 3500,
    lifetime_revenue: 5500000,
    financial_trend: []
  },
  delivery: mockDeliveryData,
  forecast: mockForecastData
};
