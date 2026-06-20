import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { HealthCard } from '@/components/health/HealthCard'
import type { SystemHealth } from '@/types'
import { RefreshCw, Activity, DollarSign, Calendar, Target, TrendingUp, XCircle } from 'lucide-react'
import { crmApi } from '@/features/crm/api'
import { clientsApi } from '@/features/clients/api'
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const PLACEHOLDER_SERVICES = [
  { name: 'backend' },
  { name: 'postgresql' },
  { name: 'redis' },
  { name: 'minio' },
  { name: 'meilisearch' },
]

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6']

export function DashboardPage() {
  const {
    data: health,
    isLoading: isLoadingHealth,
    refetch: refetchHealth,
    isFetching: isFetchingHealth,
    dataUpdatedAt: healthUpdatedAt,
  } = useQuery({
    queryKey: ['health'],
    queryFn: async (): Promise<SystemHealth> => {
      const { data } = await api.get<SystemHealth>('/health')
      return data
    },
    refetchInterval: 30_000,
  })

  const {
    data: crmStats,
    isLoading: isLoadingStats,
    refetch: refetchStats,
    isFetching: isFetchingStats,
  } = useQuery({
    queryKey: ['crmStats'],
    queryFn: crmApi.getStats,
    refetchInterval: 60_000,
  })

  const {
    data: clientStats,
    isLoading: isLoadingClientStats,
    refetch: refetchClientStats,
    isFetching: isFetchingClientStats,
  } = useQuery({
    queryKey: ['clientStats'],
    queryFn: clientsApi.getStats,
    refetchInterval: 60_000,
  })

  const lastChecked = healthUpdatedAt
    ? new Date(healthUpdatedAt).toLocaleTimeString()
    : null

  const overallStatus = health?.status ?? 'healthy'
  const overallStatusConfig = {
    healthy:  { label: 'All Systems Operational', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    degraded: { label: 'Partial Outage Detected', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    offline:  { label: 'Major Outage', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  }[overallStatus]

  const handleRefresh = () => {
    refetchHealth();
    refetchStats();
    refetchClientStats();
  }

  const isFetching = isFetchingHealth || isFetchingStats || isFetchingClientStats;

  const wonLostData = crmStats ? [
    { name: 'Won', value: crmStats.won_opportunities },
    { name: 'Lost', value: crmStats.lost_opportunities },
  ] : [];

  const pipelineData = crmStats ? [
    { name: 'Total', value: crmStats.pipeline_value },
    { name: 'Weighted', value: crmStats.weighted_pipeline_value },
  ] : [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Dashboard</h2>
          <p className="text-surface-500 mt-0.5 text-sm">
            Overview of your pipeline and system health
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastChecked && (
            <span className="text-xs text-surface-400">
              Updated {lastChecked}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-surface-600 bg-white border border-surface-200 hover:bg-surface-50 hover:border-surface-300 transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Client Stats Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Client Operations</h3>
        {isLoadingClientStats ? (
          <div className="text-center py-8 text-gray-500">Loading client stats...</div>
        ) : clientStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Active Clients</p>
                  <p className="text-2xl font-bold text-gray-900">{clientStats.active_clients}</p>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg"><Target className="w-5 h-5 text-blue-600" /></div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Monthly Retainer</p>
                  <p className="text-2xl font-bold text-gray-900">${clientStats.monthly_retainer_revenue.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 p-2 rounded-lg"><DollarSign className="w-5 h-5 text-green-600" /></div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">At Risk Clients</p>
                  <p className="text-2xl font-bold text-gray-900">{clientStats.at_risk_clients}</p>
                </div>
                <div className="bg-red-50 p-2 rounded-lg"><XCircle className="w-5 h-5 text-red-600" /></div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Renewals Due</p>
                  <p className="text-2xl font-bold text-gray-900">{clientStats.renewals_due}</p>
                </div>
                <div className="bg-amber-50 p-2 rounded-lg"><Calendar className="w-5 h-5 text-amber-600" /></div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="h-px bg-gray-200 w-full my-8"></div>

      {/* CRM Stats Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Pipeline Overview</h3>
        {isLoadingStats ? (
          <div className="text-center py-8 text-gray-500">Loading CRM stats...</div>
        ) : crmStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Pipeline Value</p>
                  <p className="text-2xl font-bold text-gray-900">${crmStats.pipeline_value.toLocaleString()}</p>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg"><DollarSign className="w-5 h-5 text-blue-600" /></div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Weighted Value</p>
                  <p className="text-2xl font-bold text-gray-900">${crmStats.weighted_pipeline_value.toLocaleString()}</p>
                </div>
                <div className="bg-indigo-50 p-2 rounded-lg"><Target className="w-5 h-5 text-indigo-600" /></div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Meetings</p>
                  <p className="text-2xl font-bold text-gray-900">{crmStats.meetings_scheduled}</p>
                </div>
                <div className="bg-amber-50 p-2 rounded-lg"><Calendar className="w-5 h-5 text-amber-600" /></div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{crmStats.conversion_rate}%</p>
                </div>
                <div className="bg-green-50 p-2 rounded-lg"><TrendingUp className="w-5 h-5 text-green-600" /></div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Charts */}
        {crmStats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h4 className="font-semibold text-gray-700 mb-4">Win / Loss Ratio</h4>
              <div className="h-[250px] flex justify-center items-center">
                {(crmStats.won_opportunities === 0 && crmStats.lost_opportunities === 0) ? (
                   <p className="text-gray-400">No closed opportunities yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={wonLostData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {wonLostData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="flex justify-center gap-6 mt-2">
                <div className="text-center">
                  <p className="text-xl font-bold text-green-600">{crmStats.won_opportunities}</p>
                  <p className="text-xs text-gray-500">Won</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-red-500">{crmStats.lost_opportunities}</p>
                  <p className="text-xs text-gray-500">Lost</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h4 className="font-semibold text-gray-700 mb-4">Pipeline Value</h4>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} tickFormatter={(value) => `$${value}`} />
                    <RechartsTooltip cursor={{ fill: '#F3F4F6' }} formatter={(value: any) => [`$${value.toLocaleString()}`, 'Value']} />
                    <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={60}>
                      {pipelineData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#3B82F6' : '#8B5CF6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="h-px bg-gray-200 w-full my-8"></div>

      {/* System Health Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">System Health</h3>
        {/* Overall Status Banner */}
        {!isLoadingHealth && health && (
          <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${overallStatusConfig.bg} ${overallStatusConfig.border} animate-fade-in mb-6`}>
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
          {isLoadingHealth
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
      </div>
    </div>
  )
}
