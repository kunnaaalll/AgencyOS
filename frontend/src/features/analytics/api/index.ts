import { useQuery } from '@tanstack/react-query'
import { useDemoQuery } from '@/lib/useDemoQuery'
import api from '@/lib/api'
import { mockGrowthData } from '@/mocks'
import { mockExecutiveSummary, mockSalesData, mockDeliveryData, mockForecastData } from '@/mocks/analytics_data'
import { mockFinanceData } from '@/mocks/finance'
import {
  GrowthMetricsResponse,
  RevenueMetricsResponse,
  SalesMetricsResponse,
  DeliveryMetricsResponse,
  ForecastResponse,
  ExecutiveSummaryResponse,
} from '../types'

export function useExecutiveSummary() {
  return useDemoQuery({
    queryKey: ['analytics', 'executive-summary'],
    queryFn: async () => {
      const { data } = await api.get<ExecutiveSummaryResponse>('/analytics/executive-summary')
      return data
    },
  }, mockExecutiveSummary)
}

export function useGrowthMetrics() {
  return useDemoQuery({
    queryKey: ['analytics', 'growth'],
    queryFn: async () => {
      const { data } = await api.get<GrowthMetricsResponse>('/analytics/growth')
      return data
    },
  }, mockGrowthData)
}

export function useSalesMetrics() {
  return useDemoQuery({
    queryKey: ['analytics', 'sales'],
    queryFn: async () => {
      const { data } = await api.get<SalesMetricsResponse>('/analytics/sales')
      return data
    },
  }, mockSalesData)
}

export function useFinanceMetrics() {
  return useDemoQuery({
    queryKey: ['analytics', 'finance'],
    queryFn: async () => {
      const { data } = await api.get<RevenueMetricsResponse>('/analytics/finance')
      return data
    },
  }, mockFinanceData)
}

export function useDeliveryMetrics() {
  return useDemoQuery({
    queryKey: ['analytics', 'delivery'],
    queryFn: async () => {
      const { data } = await api.get<DeliveryMetricsResponse>('/analytics/delivery')
      return data
    },
  }, mockDeliveryData)
}

export function useForecast() {
  return useDemoQuery({
    queryKey: ['analytics', 'forecast'],
    queryFn: async () => {
      const { data } = await api.get<ForecastResponse>('/analytics/forecast')
      return data
    },
  }, mockForecastData)
}
