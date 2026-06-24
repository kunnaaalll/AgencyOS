import { GrowthMetricsResponse } from '../features/analytics/types';

export const mockGrowthData = {
  lead_funnel: [
    { stage: 'Traffic', count: 15000 },
    { stage: 'Captured', count: 1200 },
    { stage: 'Qualified', count: 350 },
    { stage: 'Meetings', count: 120 },
    { stage: 'Proposals', count: 45 },
    { stage: 'Won', count: 18 }
  ],
  lead_qualification_trend: [
    { date: '2024-01', value: 45 },
    { date: '2024-02', value: 52 },
    { date: '2024-03', value: 61 },
    { date: '2024-04', value: 58 },
    { date: '2024-05', value: 75 },
    { date: '2024-06', value: 89 }
  ],
  client_growth_trend: [
    { date: '2024-01', value: 12 },
    { date: '2024-02', value: 15 },
    { date: '2024-03', value: 18 },
    { date: '2024-04', value: 24 },
    { date: '2024-05', value: 29 },
    { date: '2024-06', value: 36 }
  ]
} as unknown as GrowthMetricsResponse;
