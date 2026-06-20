// AgencyOS V2 — Sidebar Navigation

import { Link, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Users,
  Building2,
  ShieldCheck,
  Activity,
  Zap,
  Briefcase,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads', label: 'Leads', icon: Target },
  { to: '/crm', label: 'CRM', icon: Building2 },
  { to: '/clients', label: 'Clients', icon: Briefcase },
  { to: '/users', label: 'Users', icon: Users },
]

export function Sidebar() {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  return (
    <aside
      className="fixed left-0 top-0 h-full bg-surface-900 text-white flex flex-col z-30"
      style={{ width: 'var(--sidebar-width)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-surface-700/50">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-600 shadow-md shadow-brand-600/30 flex-shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base leading-tight">AgencyOS</h1>
          <p className="text-surface-400 text-xs">V2 Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
          Platform
        </p>

        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const isActive = currentPath === to || currentPath.startsWith(`${to}/`)
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-600/30'
                  : 'text-surface-300 hover:bg-surface-800 hover:text-white'
              )}
            >
              <Icon
                className={cn(
                  'w-4.5 h-4.5 flex-shrink-0 transition-colors',
                  isActive ? 'text-brand-400' : 'text-surface-400 group-hover:text-surface-200'
                )}
              />
              {label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />
              )}
            </Link>
          )
        })}

        {/* Future sections placeholder */}
        <div className="pt-4">
          <p className="px-3 text-xs font-semibold text-surface-600 uppercase tracking-wider mb-2">
            Coming Soon
          </p>
          {[
            { label: 'Analytics', icon: Activity },
          ].map(({ label, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-surface-600 cursor-not-allowed select-none"
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0 text-surface-700" />
              {label}
              <span className="ml-auto text-xs bg-surface-800 text-surface-600 px-1.5 py-0.5 rounded-md">
                Phase 5
              </span>
            </div>
          ))}
        </div>
      </nav>

      {/* Bottom version */}
      <div className="px-5 py-4 border-t border-surface-700/50">
        <p className="text-xs text-surface-600">Phase 1 — Core Platform</p>
      </div>
    </aside>
  )
}
