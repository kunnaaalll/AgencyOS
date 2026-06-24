import { useEffect, useState } from 'react'
import { AppSkeleton } from '@/components/layout/AppSkeleton'
import { Plus, TrendingUp, TrendingDown, IndianRupee, Users, Briefcase } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { financeApi } from '../api'
import type { FinanceSummary } from '../types'
import { DEMO_MODE } from '@/config/demo'
import { useFinanceMetrics } from '@/features/analytics/api'

export function FinanceDashboardPage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    financeApi.getSummary()
      .then(setSummary)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const { data: financeMetrics, isLoading: isFinanceLoading } = useFinanceMetrics()

  if (isLoading || isFinanceLoading) return <AppSkeleton />

  const trendData = financeMetrics?.financial_trend?.map(t => ({
    name: new Date(t.date).toLocaleDateString('default', { month: 'short' }),
    revenue: t.revenue,
    expenses: t.expense,
    profit: t.profit
  })) || []

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0)

  return (
    <div className="max-w-[1400px] mx-auto px-6 pb-24 space-y-10 mt-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-claude-display-lg text-[var(--color-ink)]">Finance OS</h1>
          <p className="text-[var(--color-muted)] text-claude-body-md mt-2">Manage your revenue, expenses, and financial health.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-md border-[var(--color-hairline)] text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)] transition-colors">Download Report</Button>
          <Button variant="primary">New Transaction</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-[var(--color-surface-card)] border-[var(--color-hairline)] rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-claude-body-sm font-semibold text-[var(--color-muted)] tracking-wide uppercase">Monthly Recurring Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-[var(--color-muted)]" />
          </CardHeader>
          <CardContent>
            <div className="text-claude-display-md text-[var(--color-ink)]">{formatCurrency(summary?.mrr || 0)}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-[var(--color-surface-card)] border-[var(--color-hairline)] rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-claude-body-sm font-semibold text-[var(--color-muted)] tracking-wide uppercase">Net Profit (YTD)</CardTitle>
            <IndianRupee className="h-4 w-4 text-[var(--color-muted)]" />
          </CardHeader>
          <CardContent>
            <div className="text-claude-display-md text-[var(--color-ink)]">{formatCurrency(summary?.net_profit || 0)}</div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--color-surface-card)] border-[var(--color-hairline)] rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-claude-body-sm font-semibold text-[var(--color-muted)] tracking-wide uppercase">Reserve Fund</CardTitle>
            <Briefcase className="h-4 w-4 text-[var(--color-muted)]" />
          </CardHeader>
          <CardContent>
            <div className="text-claude-display-md text-[var(--color-ink)]">{formatCurrency(summary?.reserve_fund || 0)}</div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--color-surface-card)] border-[var(--color-hairline)] rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-claude-body-sm font-semibold text-[var(--color-muted)] tracking-wide uppercase">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-[var(--color-success)]" />
          </CardHeader>
          <CardContent>
            <div className="text-claude-display-md text-[var(--color-success)]">{formatCurrency(summary?.total_revenue || 0)}</div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--color-surface-card)] border-[var(--color-hairline)] rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-claude-body-sm font-semibold text-[var(--color-muted)] tracking-wide uppercase">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-[var(--color-destructive)]" />
          </CardHeader>
          <CardContent>
            <div className="text-claude-display-md text-[var(--color-destructive)]">{formatCurrency(summary?.total_expenses || 0)}</div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--color-surface-card)] border-[var(--color-hairline)] rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-claude-body-sm font-semibold text-[var(--color-muted)] tracking-wide uppercase">Distribution Pool</CardTitle>
            <Users className="h-4 w-4 text-[var(--color-muted)]" />
          </CardHeader>
          <CardContent>
            <div className="text-claude-display-md text-[var(--color-ink)]">{formatCurrency(summary?.distribution_pool || 0)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1 bg-[var(--color-surface-card)] border-[var(--color-hairline)] rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-claude-title-md text-[var(--color-ink)]">Revenue vs Expenses</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-hairline)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--color-muted)'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-muted)'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-hairline)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'var(--color-surface-card)' }}
                />
                <Area type="monotone" dataKey="revenue" stackId="1" stroke="var(--color-success)" fill="var(--color-success)" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" stackId="2" stroke="var(--color-destructive)" fill="var(--color-destructive)" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1 bg-[var(--color-surface-card)] border-[var(--color-hairline)] rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-claude-title-md text-[var(--color-ink)]">Profit Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-hairline)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--color-muted)'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-muted)'}} />
                <Tooltip 
                  cursor={{fill: 'var(--color-surface-soft)'}}
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-hairline)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'var(--color-surface-card)' }}
                />
                <Bar dataKey="profit" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
