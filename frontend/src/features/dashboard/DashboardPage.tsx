import { useQuery } from '@tanstack/react-query'
import { useDemoQuery } from '@/lib/useDemoQuery'
import { dashboardMock, mockFinanceData, mockSystemData } from '@/mocks'
import api from '@/lib/api'
import { HealthCard } from '@/components/health/HealthCard'
import type { SystemHealth } from '@/types'
import { RefreshCw, Activity, IndianRupee, Calendar, Target, TrendingUp, XCircle } from 'lucide-react'
import { crmApi } from '@/features/crm/api'
import { clientsApi } from '@/features/clients/api'
import { financeApi } from '@/features/finance/api'
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const PLACEHOLDER_SERVICES = [
  { name: 'backend' },
  { name: 'postgresql' },
  { name: 'redis' },
  { name: 'minio' },
  { name: 'meilisearch' },
]

const COLORS = ['#FF6B57', '#F5E4D4', '#000000', '#D2CBB8'] // Updated to Claude colors

export function DashboardPage() {
  const {
    data: health,
    isLoading: isLoadingHealth,
    refetch: refetchHealth,
    isFetching: isFetchingHealth,
    dataUpdatedAt: healthUpdatedAt,
  } = useDemoQuery({
    queryKey: ['health'],
    queryFn: async (): Promise<SystemHealth> => {
      const { data } = await api.get<SystemHealth>('/health')
      return data
    },
    refetchInterval: 30_000,
  }, mockSystemData)

  const {
    data: crmStats,
    isLoading: isLoadingStats,
    refetch: refetchStats,
    isFetching: isFetchingStats,
  } = useDemoQuery({
    queryKey: ['crmStats'],
    queryFn: crmApi.getStats,
    refetchInterval: 60_000,
  }, dashboardMock.kpis)

  const {
    data: clientStats,
    isLoading: isLoadingClientStats,
    refetch: refetchClientStats,
    isFetching: isFetchingClientStats,
  } = useDemoQuery({
    queryKey: ['clientStats'],
    queryFn: clientsApi.getStats,
    refetchInterval: 60_000,
  }, {
    active_clients: dashboardMock.kpis.activeClients,
    monthly_retainer_revenue: dashboardMock.kpis.mrr,
    at_risk_clients: 2,
    renewals_due: 4
  })

  const {
    data: financeStats,
    isLoading: isLoadingFinance,
    refetch: refetchFinance,
    isFetching: isFetchingFinance,
  } = useDemoQuery({
    queryKey: ['financeStats'],
    queryFn: financeApi.getSummary,
    refetchInterval: 60_000,
  }, mockFinanceData)

  const lastChecked = healthUpdatedAt
    ? new Date(healthUpdatedAt).toLocaleTimeString()
    : null

  const overallStatus = health?.status ?? 'healthy'
  const overallStatusConfig = {
    healthy:  { label: 'All Systems Operational', color: 'text-[var(--color-primary)]', bg: 'bg-[var(--color-primary)]/10', border: 'border-[var(--color-primary)]/20' },
    degraded: { label: 'Partial Outage Detected', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    offline:  { label: 'Major Outage', color: 'text-[var(--color-error)]', bg: 'bg-[var(--color-error)]/10', border: 'border-[var(--color-error)]/20' },
  }[overallStatus]

  const handleRefresh = () => {
    refetchHealth();
    refetchStats();
    refetchClientStats();
    refetchFinance();
  }

  const isFetching = isFetchingHealth || isFetchingStats || isFetchingClientStats || isFetchingFinance;

  const wonLostData = crmStats ? [
    { name: 'Won', value: crmStats.won_opportunities },
    { name: 'Lost', value: crmStats.lost_opportunities },
  ] : [];

  const pipelineData = crmStats ? [
    { name: 'Total', value: crmStats.pipeline_value },
    { name: 'Weighted', value: crmStats.weighted_pipeline_value },
  ] : [];

  return (
    <div className="max-w-[1400px] mx-auto px-6 pt-8 space-y-12 pb-16 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-claude-display-lg text-[var(--color-ink)]">Dashboard</h2>
          <p className="text-[var(--color-muted)] text-claude-body-md mt-2">
            Overview of your pipeline and system health
          </p>
        </div>

        <div className="flex items-center gap-4">
          {lastChecked && (
            <span className="text-claude-body-sm text-[var(--color-muted)]">
              Updated {lastChecked}
            </span>
          )}
          <Button
            variant="secondary"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Finance Stats Section */}
      <div>
        <h3 className="text-claude-title-md text-[var(--color-ink)] mb-4">Financial Overview</h3>
        {isLoadingFinance ? (
          <div className="text-center py-8 text-[var(--color-muted)]">Loading finance stats...</div>
        ) : financeStats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card padding="md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-claude-body-sm font-semibold text-[var(--color-muted)] tracking-wide uppercase mb-2">MRR</p>
                  <p className="text-claude-display-lg text-[var(--color-ink)]">₹{financeStats.mrr.toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--color-surface-soft)]"><TrendingUp className="w-5 h-5 text-[var(--color-ink)]" /></div>
              </div>
            </Card>
            
            <Card padding="md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-claude-body-sm font-semibold text-[var(--color-muted)] tracking-wide uppercase mb-2">Net Profit</p>
                  <p className="text-claude-display-lg text-[var(--color-ink)]">₹{financeStats.net_profit.toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--color-surface-soft)]"><IndianRupee className="w-5 h-5 text-[var(--color-ink)]" /></div>
              </div>
            </Card>

            <Card padding="md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-claude-body-sm font-semibold text-[var(--color-muted)] tracking-wide uppercase mb-2">Cash Reserve</p>
                  <p className="text-claude-display-lg text-[var(--color-ink)]">₹{financeStats.reserve_fund.toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--color-surface-soft)]"><IndianRupee className="w-5 h-5 text-[var(--color-ink)]" /></div>
              </div>
            </Card>
          </div>
        ) : null}
      </div>

      {/* Client Stats Section */}
      <div>
        <h3 className="text-claude-title-md text-[var(--color-ink)] mb-4">Client Operations</h3>
        {isLoadingClientStats ? (
          <div className="text-center py-8 text-[var(--color-muted)]">Loading client stats...</div>
        ) : clientStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card padding="md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-claude-body-sm font-semibold text-[var(--color-muted)] tracking-wide uppercase mb-2">Active Clients</p>
                  <p className="text-claude-display-lg text-[var(--color-ink)]">{clientStats.active_clients}</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--color-surface-soft)]"><Target className="w-5 h-5 text-[var(--color-ink)]" /></div>
              </div>
            </Card>
            
            <Card padding="md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-claude-body-sm font-semibold text-[var(--color-muted)] tracking-wide uppercase mb-2">Monthly Retainer</p>
                  <p className="text-claude-display-lg text-[var(--color-ink)]">₹{(clientStats.mrr ?? 0).toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--color-surface-soft)]"><IndianRupee className="w-5 h-5 text-[var(--color-ink)]" /></div>
              </div>
            </Card>

            <Card padding="md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-claude-body-sm font-semibold text-[var(--color-muted)] tracking-wide uppercase mb-2">At Risk</p>
                  <p className="text-claude-display-lg text-[var(--color-ink)]">{clientStats.at_risk_clients}</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--color-error)]/10"><XCircle className="w-5 h-5 text-[var(--color-error)]" /></div>
              </div>
            </Card>

            <Card padding="md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-claude-body-sm font-semibold text-[var(--color-muted)] tracking-wide uppercase mb-2">Renewals</p>
                  <p className="text-claude-display-lg text-[var(--color-ink)]">{clientStats.renewals_due}</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--color-surface-soft)]"><Calendar className="w-5 h-5 text-[var(--color-ink)]" /></div>
              </div>
            </Card>
          </div>
        ) : null}
      </div>

      {/* CRM Stats Section */}
      <div>
        <h3 className="text-claude-title-md text-[var(--color-ink)] mb-4">Pipeline Overview</h3>
        {isLoadingStats ? (
          <div className="text-center py-8 text-[var(--color-muted)]">Loading CRM stats...</div>
        ) : crmStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card padding="md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-claude-body-sm font-semibold text-[var(--color-muted)] tracking-wide uppercase mb-2">Pipeline</p>
                  <p className="text-claude-display-lg text-[var(--color-ink)]">₹{crmStats.pipeline_value.toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--color-surface-soft)]"><IndianRupee className="w-5 h-5 text-[var(--color-ink)]" /></div>
              </div>
            </Card>
            
            <Card padding="md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-claude-body-sm font-semibold text-[var(--color-muted)] tracking-wide uppercase mb-2">Weighted</p>
                  <p className="text-claude-display-lg text-[var(--color-ink)]">₹{crmStats.weighted_pipeline_value.toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--color-surface-soft)]"><Target className="w-5 h-5 text-[var(--color-ink)]" /></div>
              </div>
            </Card>

            <Card padding="md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-claude-body-sm font-semibold text-[var(--color-muted)] tracking-wide uppercase mb-2">Meetings</p>
                  <p className="text-claude-display-lg text-[var(--color-ink)]">{crmStats.meetings_scheduled}</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--color-surface-soft)]"><Calendar className="w-5 h-5 text-[var(--color-ink)]" /></div>
              </div>
            </Card>

            <Card padding="md">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-claude-body-sm font-semibold text-[var(--color-muted)] tracking-wide uppercase mb-2">Conversion</p>
                  <p className="text-claude-display-lg text-[var(--color-ink)]">{crmStats.conversion_rate}%</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--color-primary)]/10"><TrendingUp className="w-5 h-5 text-[var(--color-primary)]" /></div>
              </div>
            </Card>
          </div>
        ) : null}

        {/* Charts */}
        {crmStats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card padding="lg">
              <h4 className="text-claude-title-sm text-[var(--color-ink)] mb-6">Win / Loss Ratio</h4>
              <div className="h-[250px] flex justify-center items-center">
                {(crmStats.won_opportunities === 0 && crmStats.lost_opportunities === 0) ? (
                   <p className="text-[var(--color-muted)]">No closed opportunities yet.</p>
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
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-hairline)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="flex justify-center gap-8 mt-4">
                <div className="text-center">
                  <p className="text-claude-display-md text-[var(--color-primary)]">{crmStats.won_opportunities}</p>
                  <p className="text-claude-body-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">Won</p>
                </div>
                <div className="text-center">
                  <p className="text-claude-display-md text-[var(--color-ink)]">{crmStats.lost_opportunities}</p>
                  <p className="text-claude-body-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">Lost</p>
                </div>
              </div>
            </Card>

            <Card padding="lg">
              <h4 className="text-claude-title-sm text-[var(--color-ink)] mb-6">Pipeline Value</h4>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-hairline)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-muted)' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-muted)' }} tickFormatter={(value) => `₹${value}`} />
                    <RechartsTooltip cursor={{ fill: 'var(--color-surface-soft)' }} formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Value']} contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-hairline)' }} />
                    <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={60}>
                      {pipelineData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--color-primary)' : 'var(--color-ink)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}
      </div>

    </div>
  )
}
