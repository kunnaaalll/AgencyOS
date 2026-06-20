// AgencyOS V2 — Type Definitions

// ── Auth ──────────────────────────────────────────────────────
export interface LoginRequest {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface MeResponse {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  is_active: boolean
  organization_id: string | null
  role_name: string | null
}

// ── Health ────────────────────────────────────────────────────
export type ServiceStatus = 'healthy' | 'degraded' | 'offline'

export interface ServiceHealth {
  name: string
  status: ServiceStatus
  latency_ms: number | null
  message?: string
}

export interface SystemHealth {
  status: ServiceStatus
  services: ServiceHealth[]
}

// ── User ──────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  organization_id: string | null
  role_id: string | null
  created_at: string
  updated_at: string
}

export interface UserListResponse {
  items: User[]
  total: number
  page: number
  page_size: number
}

// ── Organization ──────────────────────────────────────────────
export interface Organization {
  id: string
  name: string
  slug: string
  created_at: string
  updated_at: string
}

// ── Role ──────────────────────────────────────────────────────
export interface Role {
  id: string
  name: string
  permissions: string[]
  created_at: string
  updated_at: string
}

// ── API Error ─────────────────────────────────────────────────
export interface ApiError {
  error: {
    code: string
    message: string
  }
}
