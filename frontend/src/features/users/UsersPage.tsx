// AgencyOS V2 — Users Page (Placeholder)

import { Users } from 'lucide-react'

export function UsersPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">Users</h2>
        <p className="text-surface-500 mt-0.5 text-sm">Manage platform users and permissions</p>
      </div>

      {/* Placeholder content */}
      <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border-2 border-dashed border-surface-200 bg-surface-50/50">
        <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-surface-400" />
        </div>
        <h3 className="text-lg font-semibold text-surface-700">User Management</h3>
        <p className="text-surface-400 text-sm mt-1 max-w-sm">
          Full user management UI will be implemented in Phase 2. The backend API is fully operational.
        </p>
        <a
          href="http://localhost:8000/docs#/Users"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 px-4 py-2 rounded-xl text-sm font-medium text-brand-600 border border-brand-200 bg-brand-50 hover:bg-brand-100 transition-colors"
        >
          View API Docs →
        </a>
      </div>
    </div>
  )
}
