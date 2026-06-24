import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import {
  GrowthMetricsResponse,
  RevenueMetricsResponse,
  SalesMetricsResponse,
  DeliveryMetricsResponse,
  ForecastResponse,
  ExecutiveSummaryResponse,
} from '../types'

export function useExecutiveSummary() {
  return useQuery({
    queryKey: ['analytics', 'executive-summary'],
    queryFn: async () => {
      const { data } = await api.get<ExecutiveSummaryResponse>('/analytics/executive-summary')
      return data
    },
  })
}

export function useGrowthMetrics() {
  return useQuery({
    queryKey: ['analytics', 'growth'],
    queryFn: async () => {
      const { data } = await api.get<GrowthMetricsResponse>('/analytics/growth')
      return data
    },
  })
}

export function useSalesMetrics() {
  return useQuery({
    queryKey: ['analytics', 'sales'],
    queryFn: async () => {
      const { data } = await api.get<SalesMetricsResponse>('/analytics/sales')
      return data
    },
  })
}

export function useFinanceMetrics() {
  return useQuery({
    queryKey: ['analytics', 'finance'],
    queryFn: async () => {
      const { data } = await api.get<RevenueMetricsResponse>('/analytics/finance')
      return data
    },
  })
}

export function useDeliveryMetrics() {
  return useQuery({
    queryKey: ['analytics', 'delivery'],
    queryFn: async () => {
      const { data } = await api.get<DeliveryMetricsResponse>('/analytics/delivery')
      return data
    },
  })
}

export function useForecast() {
  return useQuery({
    queryKey: ['analytics', 'forecast'],
    queryFn: async () => {
      const { data } = await api.get<ForecastResponse>('/analytics/forecast')
      return data
    },
  })
}
