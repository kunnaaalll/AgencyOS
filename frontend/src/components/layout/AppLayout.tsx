// AgencyOS V2 — App Layout Shell

import { Outlet } from '@tanstack/react-router'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function AppLayout() {
  return (
    <div className="flex h-full bg-surface-50">
      <Sidebar />

      {/* Main content area */}
      <div
        className="flex flex-col flex-1 min-h-screen"
        style={{ marginLeft: 'var(--sidebar-width)' }}
      >
        <Header />

        <main
          className="flex-1 overflow-auto p-6 animate-fade-in"
          style={{ marginTop: 'var(--header-height)' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
