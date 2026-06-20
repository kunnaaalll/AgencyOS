import { useState } from 'react'

export type DateRange = '7d' | '30d' | '90d' | '1y' | 'all'

export function DateRangeFilter({ value, onChange }: { value: DateRange, onChange: (v: DateRange) => void }) {
  const options: { label: string; value: DateRange }[] = [
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 90 Days', value: '90d' },
    { label: 'Last Year', value: '1y' },
    { label: 'All Time', value: 'all' },
  ]

  return (
    <div className="flex bg-surface-900 rounded-lg p-1 border border-surface-700 w-fit">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            value === opt.value
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-surface-400 hover:text-white hover:bg-surface-800'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
