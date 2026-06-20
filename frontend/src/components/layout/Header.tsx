// AgencyOS V2 — Header Component

import { Bell, LogOut } from 'lucide-react'
import { useStore } from '@tanstack/react-store'
import { authStore } from '@/store/authStore'
import { useLogout, useCurrentUser } from '@/features/auth/authApi'

export function Header() {
  const authState = useStore(authStore)
  const { mutate: logout } = useLogout()
  const { data: user } = useCurrentUser()

  const displayUser = user ?? authState.user
  const initials = displayUser
    ? `${displayUser.first_name[0]}${displayUser.last_name[0]}`.toUpperCase()
    : '??'

  return (
    <header
      className="fixed top-0 right-0 z-20 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-surface-200 px-6"
      style={{
        left: 'var(--sidebar-width)',
        height: 'var(--header-height)',
      }}
    >
      {/* Left: Page title will be injected via context in future */}
      <div />

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications (placeholder) */}
        <button
          className="relative p-2 rounded-xl text-surface-500 hover:bg-surface-100 hover:text-surface-700 transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-2 pl-3 border-l border-surface-200">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-brand-600/20 flex-shrink-0">
            {initials}
          </div>

          {/* User info */}
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-surface-800 leading-tight">
              {displayUser?.full_name ?? 'Loading...'}
            </p>
            <p className="text-xs text-surface-500 leading-tight">
              {displayUser?.role_name ?? ''}
            </p>
          </div>

          {/* Logout */}
          <button
            id="logout-button"
            onClick={() => logout()}
            className="p-2 rounded-xl text-surface-400 hover:bg-red-50 hover:text-red-500 transition-colors ml-1"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
