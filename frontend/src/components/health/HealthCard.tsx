// AgencyOS V2 — Health Card Component

import type { ServiceHealth, ServiceStatus } from '@/types'
import { cn } from '@/lib/utils'
import {
  Database,
  Cpu,
  HardDrive,
  Search,
  Server,
} from 'lucide-react'

const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  backend:      Cpu,
  postgresql:   Database,
  redis:        Server,
  minio:        HardDrive,
  meilisearch:  Search,
}

const STATUS_CONFIG: Record<ServiceStatus, {
  label: string
  dotClass: string
  cardClass: string
  badgeClass: string
}> = {
  healthy: {
    label: 'Healthy',
    dotClass: 'healthy',
    cardClass: 'border-green-200 bg-green-50/40',
    badgeClass: 'bg-green-100 text-green-700',
  },
  degraded: {
    label: 'Degraded',
    dotClass: 'degraded',
    cardClass: 'border-amber-200 bg-amber-50/40',
    badgeClass: 'bg-amber-100 text-amber-700',
  },
  offline: {
    label: 'Offline',
    dotClass: 'offline',
    cardClass: 'border-red-200 bg-red-50/40',
    badgeClass: 'bg-red-100 text-red-700',
  },
}

interface HealthCardProps {
  service: ServiceHealth
  isLoading?: boolean
}

export function HealthCard({ service, isLoading }: HealthCardProps) {
  const Icon = SERVICE_ICONS[service.name] ?? Server
  const config = STATUS_CONFIG[isLoading ? 'healthy' : service.status]

  return (
    <div
      className={cn(
        'rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5',
        isLoading ? 'border-surface-200 bg-surface-50/40' : config.cardClass
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          isLoading ? 'bg-surface-200' : 'bg-white shadow-sm'
        )}>
          <Icon className={cn(
            'w-5 h-5',
            isLoading ? 'text-surface-400' :
            service.status === 'healthy' ? 'text-green-600' :
            service.status === 'degraded' ? 'text-amber-500' : 'text-red-500'
          )} />
        </div>

        {/* Status badge */}
        {isLoading ? (
          <span className="text-xs px-2.5 py-1 rounded-full bg-surface-200 text-surface-400 animate-pulse">
            Checking...
          </span>
        ) : (
          <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', config.badgeClass)}>
            {config.label}
          </span>
        )}
      </div>

      {/* Service name */}
      <div>
        <h3 className="font-semibold text-surface-800 capitalize">
          {service.name === 'postgresql' ? 'PostgreSQL' :
           service.name === 'meilisearch' ? 'Meilisearch' :
           service.name.charAt(0).toUpperCase() + service.name.slice(1)}
        </h3>

        <div className="flex items-center gap-2 mt-1">
          <span
            className={cn(
              'status-dot',
              isLoading ? 'loading' : config.dotClass
            )}
          />
          <span className="text-xs text-surface-500">
            {isLoading
              ? 'Checking connectivity...'
              : service.latency_ms != null
                ? `${service.latency_ms}ms response time`
                : 'No latency data'}
          </span>
        </div>
      </div>

      {/* Error message */}
      {!isLoading && service.message && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-100 font-mono">
          {service.message}
        </p>
      )}
    </div>
  )
}
