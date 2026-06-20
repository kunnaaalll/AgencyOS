// AgencyOS V2 — Dashboard Page

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { HealthCard } from '@/components/health/HealthCard'
import type { SystemHealth } from '@/types'
import { RefreshCw, Activity } from 'lucide-react'

const PLACEHOLDER_SERVICES = [
  { name: 'backend' },
  { name: 'postgresql' },
  { name: 'redis' },
  { name: 'minio' },
  { name: 'meilisearch' },
]

export function DashboardPage() {
  const {
    data: health,
    isLoading,
    refetch,
    isFetching,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['health'],
    queryFn: async (): Promise<SystemHealth> => {
      const { data } = await api.get<SystemHealth>('/health')
      return data
    },
    refetchInterval: 30_000,  // Auto-refresh every 30s
  })

  const lastChecked = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString()
    : null

  const overallStatus = health?.status ?? 'healthy'
  const overallStatusConfig = {
    healthy:  { label: 'All Systems Operational', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    degraded: { label: 'Partial Outage Detected', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    offline:  { label: 'Major Outage', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  }[overallStatus]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">System Health</h2>
          <p className="text-surface-500 mt-0.5 text-sm">
            Real-time connectivity status for all services
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastChecked && (
            <span className="text-xs text-surface-400">
              Updated {lastChecked}
            </span>
          )}
          <button
            id="health-refresh"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-surface-600 bg-white border border-surface-200 hover:bg-surface-50 hover:border-surface-300 transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Status Banner */}
      {!isLoading && health && (
        <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${overallStatusConfig.bg} ${overallStatusConfig.border} animate-fade-in`}>
          <Activity className={`w-5 h-5 ${overallStatusConfig.color}`} />
          <div>
            <p className={`font-semibold ${overallStatusConfig.color}`}>
              {overallStatusConfig.label}
            </p>
            <p className="text-xs text-surface-500 mt-0.5">
              {health.services.filter(s => s.status === 'healthy').length} of{' '}
              {health.services.length} services are healthy
            </p>
          </div>
        </div>
      )}

      {/* Health Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? PLACEHOLDER_SERVICES.map((s) => (
              <HealthCard
                key={s.name}
                service={{ name: s.name, status: 'healthy', latency_ms: null }}
                isLoading
              />
            ))
          : (health?.services ?? []).map((service) => (
              <HealthCard key={service.name} service={service} />
            ))
        }
      </div>

      {/* Quick Stats */}
      {!isLoading && health && (
        <div className="grid grid-cols-3 gap-4 pt-2">
          {[
            { label: 'Healthy', count: health.services.filter(s => s.status === 'healthy').length, color: 'text-green-600 bg-green-50' },
            { label: 'Degraded', count: health.services.filter(s => s.status === 'degraded').length, color: 'text-amber-600 bg-amber-50' },
            { label: 'Offline', count: health.services.filter(s => s.status === 'offline').length, color: 'text-red-600 bg-red-50' },
          ].map(({ label, count, color }) => (
            <div key={label} className={`rounded-xl p-4 text-center ${color}`}>
              <p className="text-3xl font-bold">{count}</p>
              <p className="text-sm font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
