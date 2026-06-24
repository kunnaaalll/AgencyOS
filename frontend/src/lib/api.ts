// AgencyOS V2 — Axios API Client with Auth Interceptors

import axios, { AxiosError, type AxiosInstance } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
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

import { DEMO_MODE } from '../config/demo'

const toast = {
  error: (msg: string) => console.warn(`[Toast] ${msg}`)
}

// ── Response Interceptor: Handle 401 / Token Refresh ─────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    console.log('INTERCEPTOR ERROR:', error.response?.status, error.config?.url);
    if (DEMO_MODE) {
      console.error('API Error intercepted in Demo Mode:', error)
      toast.error('Using demo data')
      return Promise.resolve({ data: {} })
    }

    // Do not intercept 401 for login endpoint to allow the component to handle the error
    const url = error.config?.url || '';
    if (url.includes('/auth/login')) {
      return Promise.reject(error)
    }

    const originalRequest = error.config as typeof error.config & { _retry?: boolean }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem('refresh_token')

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refresh_token: refreshToken,
          })

          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${data.access_token}`
          }

          return api(originalRequest)
        } catch {
          // Refresh failed — clear auth and redirect to login
          console.error('API INTERCEPTOR REDIRECTING TO LOGIN (Refresh Failed)')
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          // window.location.href = '/login'
        }
      } else {
        console.error('API INTERCEPTOR REDIRECTING TO LOGIN (No Refresh Token)', error.config?.url)
        // window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api
