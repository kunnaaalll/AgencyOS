import { useFinanceMetrics } from '../api'
import { DateRangeFilter, DateRange } from '../components/DateRangeFilter'
import { exportToCsv } from '../utils/exportCsv'
import { useState } from 'react'
import { Download, DollarSign } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts'

export function FinanceAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const { data, isLoading } = useFinanceMetrics()

  if (isLoading || !data) {
    return <div className="p-8 text-white">Loading...</div>
  }

  const handleExport = () => {
    exportToCsv('finance_metrics.csv', data.financial_trend)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-500" /> Finance Analytics
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-surface-800 text-white rounded-lg hover:bg-surface-700 transition-colors border border-surface-600">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          
          <div className="bg-surface-900 border border-surface-700/50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Revenue & Expense Trend</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.financial_trend}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                  <Legend verticalAlign="top" height={36}/>
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface-900 border border-surface-700/50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Profit & MRR Growth</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.financial_trend}>
                  <defs>
                    <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                  <Legend verticalAlign="top" height={36}/>
                  <Area type="monotone" dataKey="profit" name="Profit" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorProf)" />
                  <Area type="monotone" dataKey="mrr" name="MRR" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMRR)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
