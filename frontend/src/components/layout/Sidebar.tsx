// AgencyOS V2 — Sidebar Navigation

import { Link, useRouterState } from '@tanstack/react-router'
import { authStore } from '@/store/authStore'
import {
  LayoutDashboard,
  Users,
  Building2,
  ShieldCheck,
  Activity,
  Zap,
  Briefcase,
  Target,
  BookOpen,
  FileBox,
  Key,
  DollarSign,
  MonitorDot,
  ClipboardList,
  DatabaseBackup,
  Bell,
  Send
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
  { to: '/outreach', label: 'Outreach Drafts', icon: Send },
  { to: '/clients', label: 'Clients', icon: Briefcase },
  { to: '/knowledge', label: 'Knowledge OS', icon: BookOpen },
  { to: '/documents', label: 'Document Vault', icon: FileBox },
  { to: '/credentials', label: 'Credentials', icon: Key },
  { to: '/users', label: 'Users', icon: Users },
]

export function Sidebar() {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const userRole = authStore.state.user?.role?.name || ''
  const isSuperAdmin = userRole === 'Super Admin'

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
            Analytics & OS
          </p>
          {[
            { label: 'Growth', to: '/analytics/growth', icon: Target },
            { label: 'Sales', to: '/analytics/sales', icon: Activity },
            { label: 'Finance', to: '/analytics/finance', icon: DollarSign },
            { label: 'Delivery', to: '/analytics/delivery', icon: Briefcase },
          ].map(({ label, to, icon: Icon }) => {
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
        </div>

        {/* System / Automation OS */}
        <div className="pt-4 pb-12">
          <p className="px-3 text-xs font-semibold text-surface-600 uppercase tracking-wider mb-2">
            Automation OS
          </p>
          <Link
            to="/system/notifications"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
              (currentPath === '/system/notifications' || currentPath.startsWith('/system/notifications/'))
                ? 'bg-brand-600/20 text-brand-300 border border-brand-600/30'
                : 'text-surface-300 hover:bg-surface-800 hover:text-white'
            )}
          >
            <Bell
              className={cn(
                'w-4.5 h-4.5 flex-shrink-0 transition-colors',
                (currentPath === '/system/notifications' || currentPath.startsWith('/system/notifications/')) ? 'text-brand-400' : 'text-surface-400 group-hover:text-surface-200'
              )}
            />
            Notifications
          </Link>
          
          {isSuperAdmin && (
            <>
              {[
                { label: 'System Monitor', to: '/system/monitor', icon: MonitorDot },
                { label: 'Audit Log', to: '/system/audit', icon: ClipboardList },
                { label: 'Backups', to: '/system/backups', icon: DatabaseBackup },
              ].map(({ label, to, icon: Icon }) => {
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
                  </Link>
                )
              })}
            </>
          )}
        </div>
      </nav>

      {/* Bottom version */}
      <div className="px-5 py-4 border-t border-surface-700/50">
        <p className="text-xs text-surface-600">Phase 1 — Core Platform</p>
      </div>
    </aside>
  )
}
