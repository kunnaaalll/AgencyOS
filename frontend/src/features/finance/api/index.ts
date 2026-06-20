import { api } from '@/lib/api'
import type { 
  Revenue, Expense, Founder, Distribution, FinanceSummary, Forecast 
} from '../types'

export const financeApi = {
  // -- Revenue --
  getRevenues: () => api.get<Revenue[]>('/finance/revenue').then((res) => res.data),
  createRevenue: (data: Partial<Revenue>) => api.post<Revenue>('/finance/revenue', data).then((res) => res.data),
  updateRevenue: (id: string, data: Partial<Revenue>) => api.patch<Revenue>(`/finance/revenue/${id}`, data).then((res) => res.data),
  deleteRevenue: (id: string) => api.delete(`/finance/revenue/${id}`),

  // -- Expenses --
  getExpenses: () => api.get<Expense[]>('/finance/expenses').then((res) => res.data),
  createExpense: (data: Partial<Expense>) => api.post<Expense>('/finance/expenses', data).then((res) => res.data),
  updateExpense: (id: string, data: Partial<Expense>) => api.patch<Expense>(`/finance/expenses/${id}`, data).then((res) => res.data),
  deleteExpense: (id: string) => api.delete(`/finance/expenses/${id}`),

  // -- Founders --
  getFounders: () => api.get<Founder[]>('/finance/founders').then((res) => res.data),
  createFounder: (data: Partial<Founder>) => api.post<Founder>('/finance/founders', data).then((res) => res.data),
  updateFounder: (id: string, data: Partial<Founder>) => api.patch<Founder>(`/finance/founders/${id}`, data).then((res) => res.data),
  deleteFounder: (id: string) => api.delete(`/finance/founders/${id}`),

  // -- Reports --
  getSummary: () => api.get<FinanceSummary>('/finance/summary').then((res) => res.data),
  getForecast: () => api.get<Forecast>('/finance/forecast').then((res) => res.data),
}
