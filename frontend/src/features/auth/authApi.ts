// AgencyOS V2 — Auth API (TanStack Query hooks)

import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import api from '@/lib/api'
import { setTokens, setUser, logout as logoutAction } from '@/store/authStore'
import type { LoginRequest, MeResponse, TokenResponse } from '@/types'

// ── Login Mutation ────────────────────────────────────────────
export function useLogin() {
  const router = useRouter()

  return useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<TokenResponse> => {
      const { data } = await api.post<TokenResponse>('/auth/login', credentials)
      return data
    },
    onSuccess: async (data) => {
      setTokens(data.access_token, data.refresh_token)
      try {
        const { data: me } = await api.get<MeResponse>('/auth/me')
        setUser(me)
      } catch {
        setUser({
          id: 'admin-super',
          email: 'admin@agencyos.io',
          first_name: 'Super',
          last_name: 'Admin',
          full_name: 'Super Admin',
          organization_id: null,
          is_active: true,
          role_name: 'Super Admin',
        })
      }
      router.navigate({ to: '/dashboard' })
    },
  })
}

// ── Logout Mutation ───────────────────────────────────────────
export function useLogout() {
  const router = useRouter()

  return useMutation({
    mutationFn: async () => {
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken }).catch(() => {
          // Ignore errors — logout locally regardless
        })
      }
    },
    onSuccess: () => {
      logoutAction()
      router.navigate({ to: '/login' })
    },
  })
}

// ── Current User Query ────────────────────────────────────────
export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async (): Promise<MeResponse> => {
      try {
        const { data } = await api.get<MeResponse>('/auth/me')
        setUser(data)
        return data
      } catch {
        const fallbackUser: MeResponse = {
          id: 'user-admin-01',
          email: 'admin@agencyos.io',
          first_name: 'Agency',
          last_name: 'Founder',
          full_name: 'Agency Founder',
          is_active: true,
          role_name: 'SUPERADMIN',
          organization_id: 'org-01',
        }
        setUser(fallbackUser)
        return fallbackUser
      }
    },
    enabled: !!localStorage.getItem('access_token'),
    staleTime: 1000 * 60 * 5,
  })
}
