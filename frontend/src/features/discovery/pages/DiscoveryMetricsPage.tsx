import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { discoveryApi, DiscoveryMetrics, SourceStat, TopItem } from '../api/discoveryApi';

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KPICard({
  label,
  value,
  sub,
  color = 'indigo',
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: 'from-indigo-500 to-indigo-600',
    emerald: 'from-emerald-500 to-emerald-600',
    violet: 'from-violet-500 to-violet-600',
    amber: 'from-amber-500 to-amber-600',
    rose: 'from-rose-500 to-rose-600',
    sky: 'from-sky-500 to-sky-600',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center text-2xl flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Source Stats Table ────────────────────────────────────────────────────────

function SourceStatsTable({ stats }: { stats: SourceStat[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="pb-3 text-gray-500 font-medium">Source</th>
            <th className="pb-3 text-gray-500 font-medium text-right">Total</th>
            <th className="pb-3 text-gray-500 font-medium text-right">Valid</th>
            <th className="pb-3 text-gray-500 font-medium text-right">Dupes</th>
            <th className="pb-3 text-gray-500 font-medium text-right">Success %</th>
            <th className="pb-3 text-gray-500 font-medium text-right">Avg Runtime</th>
          </tr>
        </thead>
        <tbody>
          {stats.map(s => (
            <tr key={s.source} className="border-b border-gray-100 last:border-0">
              <td className="py-3 font-medium capitalize">{s.source.replace('_', ' ')}</td>
              <td className="py-3 text-right">{s.total.toLocaleString()}</td>
              <td className="py-3 text-right text-emerald-600">{s.valid.toLocaleString()}</td>
              <td className="py-3 text-right text-amber-600">{s.duplicates.toLocaleString()}</td>
              <td className="py-3 text-right">
                <span className={`font-medium ${
                  s.success_rate >= 50 ? 'text-emerald-600' :
                  s.success_rate >= 25 ? 'text-amber-600' : 'text-rose-600'
                }`}>
                  {s.success_rate}%
                </span>
              </td>
              <td className="py-3 text-right text-gray-500">
                {s.avg_runtime_seconds > 0 ? `${s.avg_runtime_seconds}s` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Metrics Page ─────────────────────────────────────────────────────────

const CHART_COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#84cc16',
];

const DAYS_OPTIONS = [7, 14, 30, 60, 90];

export function DiscoveryMetricsPage() {
  const [days, setDays] = useState(30);

  const { data: metrics, isLoading, refetch } = useQuery<DiscoveryMetrics>({
    queryKey: ['discovery-metrics', days],
    queryFn: () => discoveryApi.getMetrics(days),
    refetchInterval: 60000, // Auto-refresh every 60 seconds
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin text-5xl mb-4">⟳</div>
          <p className="text-gray-500">Loading metrics...</p>
        </div>
      </div>
    );
  }

  const m = metrics;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Discovery Metrics</h1>
          <p className="text-gray-500 mt-1">Pipeline performance — auto-refreshes every 60 seconds</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {DAYS_OPTIONS.map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  days === d
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4 mb-8">
        <KPICard
          label="Total Discovered"
          value={(m?.total_discovered ?? 0).toLocaleString()}
          icon="🔍"
          color="indigo"
        />
        <KPICard
          label="Total Validated"
          value={(m?.total_validated ?? 0).toLocaleString()}
          sub={`${m?.validation_success_rate ?? 0}% success rate`}
          icon="✅"
          color="emerald"
        />
        <KPICard
          label="Total Promoted"
          value={(m?.total_promoted ?? 0).toLocaleString()}
          sub={`${m?.promotion_rate ?? 0}% promotion rate`}
          icon="🚀"
          color="violet"
        />
        <KPICard
          label="Businesses/Hour"
          value={`${m?.businesses_per_hour ?? 0}`}
          sub="Last 24 hours"
          icon="⚡"
          color="amber"
        />
      </div>

      {/* Rate Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Validation Rate', value: m?.validation_success_rate ?? 0, color: 'emerald', icon: '✅' },
          { label: 'Duplicate Rate', value: m?.duplicate_rate ?? 0, color: 'amber', icon: '🔁' },
          { label: 'Promotion Rate', value: m?.promotion_rate ?? 0, color: 'violet', icon: '📈' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500 mb-2">{icon} {label}</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-gray-900">{value}%</span>
            </div>
            <div className="mt-3 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full bg-${color}-500 transition-all duration-700`}
                style={{ width: `${Math.min(value, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Daily Discovery Trend */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-5">
          📅 Daily Discovery Volume (last {days} days)
        </h2>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={m?.daily_counts ?? []} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="discoveryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickFormatter={v => v.slice(5)} // Show MM-DD
            />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#discoveryGradient)"
              name="Businesses Discovered"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top Industries + Locations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Top Industries */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-5">🏢 Top Industries</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={m?.top_industries ?? []}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#374151' }}
                width={110}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Bar dataKey="count" name="Businesses" radius={[0, 4, 4, 0]}>
                {(m?.top_industries ?? []).map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Locations */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-5">📍 Top Locations</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={m?.top_locations ?? []}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#374151' }}
                width={100}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Bar dataKey="count" name="Businesses" radius={[0, 4, 4, 0]}>
                {(m?.top_locations ?? []).map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Source Stats Table */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-5">📊 Source Performance</h2>
        {m?.source_stats && m.source_stats.length > 0 ? (
          <SourceStatsTable stats={m.source_stats} />
        ) : (
          <p className="text-gray-400 text-sm text-center py-8">
            No source data yet. Run some discovery jobs to see metrics.
          </p>
        )}
      </div>
    </div>
  );
}
