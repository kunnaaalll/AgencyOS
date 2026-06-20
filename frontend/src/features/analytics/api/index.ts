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
      const { data } = await api.get<ExecutiveSummaryResponse>('/v1/analytics/executive-summary')
      return data
    },
  })
}

export function useGrowthMetrics() {
  return useQuery({
    queryKey: ['analytics', 'growth'],
    queryFn: async () => {
      const { data } = await api.get<GrowthMetricsResponse>('/v1/analytics/growth')
      return data
    },
  })
}

export function useSalesMetrics() {
  return useQuery({
    queryKey: ['analytics', 'sales'],
    queryFn: async () => {
      const { data } = await api.get<SalesMetricsResponse>('/v1/analytics/sales')
      return data
    },
  })
}

export function useFinanceMetrics() {
  return useQuery({
    queryKey: ['analytics', 'finance'],
    queryFn: async () => {
      const { data } = await api.get<RevenueMetricsResponse>('/v1/analytics/finance')
      return data
    },
  })
}

export function useDeliveryMetrics() {
  return useQuery({
    queryKey: ['analytics', 'delivery'],
    queryFn: async () => {
      const { data } = await api.get<DeliveryMetricsResponse>('/v1/analytics/delivery')
      return data
    },
  })
}

export function useForecast() {
  return useQuery({
    queryKey: ['analytics', 'forecast'],
    queryFn: async () => {
      const { data } = await api.get<ForecastResponse>('/v1/analytics/forecast')
      return data
    },
  })
}
