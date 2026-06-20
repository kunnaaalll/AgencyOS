import { useSalesMetrics } from '../api'
import { DateRangeFilter, DateRange } from '../components/DateRangeFilter'
import { exportToCsv } from '../utils/exportCsv'
import { useState } from 'react'
import { Download, PieChart as PieChartIcon } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899'];

export function SalesAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const { data, isLoading } = useSalesMetrics()

  if (isLoading || !data) {
    return <div className="p-8 text-white">Loading...</div>
  }

  const handleExport = () => {
    exportToCsv('sales_metrics.csv', data.pipeline_stage_distribution)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <PieChartIcon className="w-6 h-6 text-brand-500" /> Sales Analytics
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-surface-800 text-white rounded-lg hover:bg-surface-700 transition-colors border border-surface-600">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-surface-900 border border-surface-700/50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Pipeline Stage Distribution</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.pipeline_stage_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.pipeline_stage_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface-900 border border-surface-700/50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Win / Loss Ratio</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.win_loss_ratio}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {data.win_loss_ratio.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Won' ? '#10b981' : '#ef4444'} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface-900 border border-surface-700/50 rounded-2xl p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-6">Deal Size Distribution</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.deal_size_distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
