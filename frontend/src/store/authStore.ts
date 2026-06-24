// AgencyOS V2 — Auth Store (TanStack Store)

import { Store } from '@tanstack/store'
import type { MeResponse } from '@/types'

interface AuthState {
  user: MeResponse | null
  isAuthenticated: boolean
  isLoading: boolean
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,
}

export const authStore = new Store<AuthState>(initialState)

// ── Actions ───────────────────────────────────────────────────

export function setUser(user: MeResponse | null) {
  authStore.setState((state) => ({
    ...state,
    user,
    isAuthenticated: !!user,
    isLoading: false,
  }))
}

export function setLoading(isLoading: boolean) {
  authStore.setState((state) => ({ ...state, isLoading }))
}

export function logout() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
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
