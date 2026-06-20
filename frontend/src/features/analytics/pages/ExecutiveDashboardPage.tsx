import { useState } from 'react'
import { useExecutiveSummary } from '../api'
import { DateRangeFilter, DateRange } from '../components/DateRangeFilter'
import { 
  TrendingUp, Users, DollarSign, Briefcase, Activity, 
  ArrowUpRight, ArrowDownRight, Target, CheckCircle, Clock
} from 'lucide-react'

export function ExecutiveDashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const { data: summary, isLoading, error } = useExecutiveSummary()

  if (isLoading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="flex-1 p-8">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
          Failed to load executive summary.
        </div>
      </div>
    )
  }

  const { growth, sales, finance, delivery, forecast } = summary

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Header & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Executive Dashboard</h1>
            <p className="text-surface-400 text-sm mt-1">Analytics OS overview across all operations.</p>
          </div>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>

        {/* 1. Executive Summary & Forecast Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ForecastCard 
            title="Projected MRR" 
            value={`$${forecast.projected_mrr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
            icon={TrendingUp} 
            color="text-emerald-400" 
            bg="bg-emerald-500/10" 
          />
          <ForecastCard 
            title="Projected Profit" 
            value={`$${forecast.projected_profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
            icon={DollarSign} 
            color="text-emerald-400" 
            bg="bg-emerald-500/10" 
          />
          <ForecastCard 
            title="Projected Clients" 
            value={forecast.projected_clients} 
            icon={Users} 
            color="text-brand-400" 
            bg="bg-brand-500/10" 
          />
          <div className="bg-surface-900 border border-surface-700/50 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-medium text-surface-400">Hiring Recommendation</p>
              <div className={`p-2 rounded-xl ${forecast.hiring_recommendation ? 'bg-amber-500/10' : 'bg-surface-800'}`}>
                <Briefcase className={`w-5 h-5 ${forecast.hiring_recommendation ? 'text-amber-400' : 'text-surface-500'}`} />
              </div>
            </div>
            <div>
              <h3 className={`text-xl font-bold ${forecast.hiring_recommendation ? 'text-amber-400' : 'text-white'}`}>
                {forecast.hiring_recommendation ? 'Recommend Hiring' : 'Hold Hiring'}
              </h3>
              <p className="text-xs text-surface-400 mt-1">{forecast.hiring_reason}</p>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Growth Metrics */}
          <SectionCard title="Growth Metrics" href="/analytics/growth">
            <MetricRow label="Total Leads" value={growth.total_leads} />
            <MetricRow label="Qualified Leads" value={growth.qualified_leads} />
            <MetricRow label="Qualification Rate" value={`${growth.lead_qualification_rate.toFixed(1)}%`} />
            <MetricRow label="Active Clients" value={growth.active_clients} />
            <MetricRow label="Churn Rate" value={`${growth.churn_rate.toFixed(1)}%`} />
          </SectionCard>

          {/* Revenue Metrics */}
          <SectionCard title="Revenue Metrics" href="/analytics/finance">
            <MetricRow label="MRR" value={`$${finance.mrr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
            <MetricRow label="ARR" value={`$${finance.arr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
            <MetricRow label="Revenue Growth" value={`${finance.revenue_growth_percentage.toFixed(1)}%`} />
            <MetricRow label="Avg Revenue / Client" value={`$${finance.average_revenue_per_client.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
          </SectionCard>

          {/* Sales Metrics */}
          <SectionCard title="Sales Metrics" href="/analytics/sales">
            <MetricRow label="Pipeline Value" value={`$${sales.pipeline_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
            <MetricRow label="Weighted Pipeline" value={`$${sales.weighted_pipeline_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
            <MetricRow label="Win Rate" value={`${growth.win_rate.toFixed(1)}%`} />
            <MetricRow label="Avg Deal Size" value={`$${sales.average_deal_size.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
          </SectionCard>

          {/* Delivery Metrics */}
          <SectionCard title="Delivery Metrics" href="/analytics/delivery">
            <MetricRow label="Open Tasks" value={delivery.open_tasks} />
            <MetricRow label="Completed Tasks" value={delivery.completed_tasks} />
            <MetricRow label="Project Completion" value={`${delivery.project_completion_rate.toFixed(1)}%`} />
            <MetricRow label="Renewals Due" value={delivery.renewals_due} />
          </SectionCard>

        </div>

      </div>
    </div>
  )
}

function ForecastCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-surface-900 border border-surface-700/50 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group hover:border-brand-500/30 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <p className="text-sm font-medium text-surface-400">{title}</p>
        <div className={`p-2 rounded-xl ${bg}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
      </div>
    </div>
  )
}

function SectionCard({ title, href, children }: { title: string, href: string, children: React.ReactNode }) {
  return (
    <div className="bg-surface-900 border border-surface-700/50 rounded-2xl flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-surface-700/50 flex justify-between items-center bg-surface-800/20">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <a href={href} className="text-brand-400 text-sm font-medium hover:text-brand-300 flex items-center gap-1 transition-colors">
          View Detailed <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>
      <div className="p-6 grid gap-4">
        {children}
      </div>
    </div>
  )
}

function MetricRow({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="flex justify-between items-center pb-3 border-b border-surface-800 last:border-0 last:pb-0">
      <span className="text-surface-300 text-sm">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  )
}
