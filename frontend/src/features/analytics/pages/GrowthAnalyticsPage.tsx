import { useGrowthMetrics } from '../api'
import { DateRangeFilter, DateRange } from '../components/DateRangeFilter'
import { exportToCsv } from '../utils/exportCsv'
import { useState } from 'react'
import { Download, Target } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts'

export function GrowthAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const { data, isLoading } = useGrowthMetrics()

  if (isLoading || !data) {
    return <div className="p-8 text-white">Loading...</div>
  }

  const handleExport = () => {
    // Export funnel as CSV
    exportToCsv('growth_metrics.csv', data.lead_funnel)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Target className="w-6 h-6 text-brand-500" /> Growth Analytics
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-surface-800 text-white rounded-lg hover:bg-surface-700 transition-colors border border-surface-600">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-surface-900 border border-surface-700/50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Lead Funnel</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.lead_funnel} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                  <XAxis type="number" stroke="#9ca3af" />
                  <YAxis type="category" dataKey="stage" stroke="#9ca3af" width={100} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface-900 border border-surface-700/50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Lead Qualification Trend</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.lead_qualification_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface-900 border border-surface-700/50 rounded-2xl p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-6">Client Growth Trend</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.client_growth_trend}>
                  <defs>
                    <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                  <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorClients)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
