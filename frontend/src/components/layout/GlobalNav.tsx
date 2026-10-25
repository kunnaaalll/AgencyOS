import React, { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { LogOut, Bell, Search, Hexagon, Menu, X } from 'lucide-react'
import { useLogout } from '@/features/auth/authApi'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/leads', label: 'Leads' },
  { to: '/discovery/runs', label: 'Discovery' },
  { to: '/crm', label: 'CRM' },
  { to: '/outreach', label: 'Outreach' },
  { to: '/clients', label: 'Clients' },
  { to: '/finance', label: 'Finance' },
  { to: '/knowledge', label: 'Knowledge' },
  { to: '/documents', label: 'Documents' },
  { to: '/system/monitor', label: 'System' },
]

export function GlobalNav() {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const { mutate: logout } = useLogout()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  return (
    <div className="w-full sticky top-0 z-50 bg-[var(--color-canvas)] border-b border-[var(--color-hairline)] relative">
      <nav className="w-full max-w-[1400px] mx-auto min-h-[64px] py-2 flex items-center justify-between px-6 flex-wrap gap-y-2">
        {/* Left: Brand */}
        <div className="flex items-center">
          <button 
            className="lg:hidden mr-4 w-8 h-8 flex items-center justify-center rounded-md text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)] transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link to="/" className="flex items-center hover:opacity-90 transition-opacity flex-shrink-0 mr-4">
            <img src="/Logo-transparent.png" alt="AgencyOS" className="h-7 w-auto object-contain dark:hidden" />
            <img src="/Logo-dark.png" alt="AgencyOS" className="h-7 w-auto object-contain hidden dark:block" />
          </Link>
        </div>
        
        {/* Center: Main Links (Desktop) */}
        <div className="hidden lg:flex items-center gap-1 flex-1 justify-center mx-4">
          <div className="flex flex-wrap justify-center items-center gap-1">
            {NAV_ITEMS.map(({ to, label }) => {
              const isActive = currentPath === to || currentPath.startsWith(`${to}/`)
              return (
                 <Link 
                  key={to} 
                  to={to} 
                  className={cn(
                    "px-2.5 py-1.5 rounded-md transition-all duration-200 text-claude-nav-link whitespace-nowrap",
                    isActive 
                      ? "bg-[var(--color-surface-card)] text-[var(--color-ink)] shadow-sm font-semibold" 
                      : "text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)]"
                  )}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          <button className="hidden sm:flex w-8 h-8 items-center justify-center rounded-md text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)] transition-colors">
            <Search className="w-[16px] h-[16px]" />
          </button>
          <button className="hidden sm:flex w-8 h-8 items-center justify-center rounded-md text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)] transition-colors">
            <Bell className="w-[16px] h-[16px]" />
          </button>
          <div className="hidden sm:block w-[1px] h-4 bg-[var(--color-hairline)] mx-1"></div>
          <Button 
            variant="secondary"
            size="sm"
            onClick={() => logout()}
            className="flex items-center gap-2"
          >
            <span className="hidden sm:inline">Sign Out</span>
            <LogOut className="w-[14px] h-[14px]" />
          </Button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-[64px] left-0 w-full bg-[var(--color-canvas)] border-b border-[var(--color-hairline)] shadow-lg max-h-[calc(100vh-64px)] overflow-y-auto">
          <div className="flex flex-col py-2 px-4">
            {NAV_ITEMS.map(({ to, label }) => {
              const isActive = currentPath === to || currentPath.startsWith(`${to}/`)
              return (
                 <Link 
                  key={to} 
                  to={to} 
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-md transition-all duration-200 text-claude-nav-link mb-1",
                    isActive 
                      ? "bg-[var(--color-surface-card)] text-[var(--color-ink)] font-semibold" 
                      : "text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)]"
                  )}
                >
                  {label}
                </Link>
              )
            })}
            <div className="h-[1px] bg-[var(--color-hairline)] my-2"></div>
            <div className="flex gap-4 px-4 py-2">
              <button className="flex items-center gap-2 text-[var(--color-muted)]">
                <Search className="w-5 h-5" />
                <span className="text-claude-body-sm">Search</span>
              </button>
              <button className="flex items-center gap-2 text-[var(--color-muted)]">
                <Bell className="w-5 h-5" />
                <span className="text-claude-body-sm">Notifications</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
