// AgencyOS V2 — Auth Store (TanStack Store)

import { Store } from '@tanstack/store'
import type { MeResponse } from '@/types'

interface AuthState {
  user: MeResponse | null
  isAuthenticated: boolean
  isLoading: boolean
}

const savedUser = localStorage.getItem('mock_user')
const parsedUser = savedUser ? JSON.parse(savedUser) : null

const initialState: AuthState = {
  user: parsedUser,
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,
}

export const authStore = new Store<AuthState>(initialState)

// ── Actions ───────────────────────────────────────────────────

export function setUser(user: MeResponse) {
  localStorage.setItem('mock_user', JSON.stringify(user))
  authStore.setState((state) => ({
    ...state,
    user,
    isAuthenticated: true,
    isLoading: false,
  }))
}

export function setLoading(isLoading: boolean) {
  authStore.setState((state) => ({ ...state, isLoading }))
}

export function logout() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('mock_user')
  authStore.setState(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  }))
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('access_token', accessToken)
  localStorage.setItem('refresh_token', refreshToken)
  authStore.setState((state) => ({
    ...state,
    isAuthenticated: true,
  }))
}

export function mockLogin(role: 'admin' | 'co-founder') {
  setTokens('mock-access', 'mock-refresh')
  setUser({
    id: 'mock-1',
    email: `${role}@agencyos.com`,
    first_name: role === 'admin' ? 'Admin' : 'Co-Founder',
    last_name: 'User',
    full_name: role === 'admin' ? 'Admin User' : 'Co-Founder User',
    is_active: true,
    organization_id: 'org-1',
    role_name: role,
  })
}
