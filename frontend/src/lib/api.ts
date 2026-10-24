// AgencyOS V2 — Genuine Axios API Client with Real Auth Interceptors

import axios, { AxiosError, type AxiosInstance } from 'axios'

const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host.startsWith('app.')) {
      return `${window.location.protocol}//${host.replace(/^app\./, 'api.')}`
    }
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:8000'
    }
    if (host.includes('trycloudflare.com') || host.includes('pages.dev') || !host.includes('.')) {
      return window.location.origin
    }
    return `${window.location.protocol}//api.${host}`
  }
  return 'http://localhost:8000'
}

export const API_BASE_URL = getApiBaseUrl()

const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// ── Request Interceptor: Attach Bearer Token ──────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response Interceptor: Token Refresh on 401 ────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem('refresh_token')

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken,
          })

          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${data.access_token}`
          }

          return api(originalRequest)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      }
    }

    return Promise.reject(error)
  }
)

export default api
