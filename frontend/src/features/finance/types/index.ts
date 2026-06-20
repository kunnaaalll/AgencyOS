export type RevenueStatus = 'PENDING' | 'RECEIVED' | 'OVERDUE'
export type ExpenseStatus = 'PENDING' | 'PAID'

export interface Revenue {
  id: string
  client_id: string | null
  amount: number
  currency: string
  description: string | null
  invoice_number: string | null
  received_date: string | null
  payment_method: string | null
  status: RevenueStatus
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  category: string
  amount: number
  currency: string
  description: string | null
  vendor: string | null
  expense_date: string | null
  status: ExpenseStatus
  created_at: string
  updated_at: string
}

export interface Founder {
  id: string
  name: string
  email: string
  equity_percentage: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Distribution {
  id: string
  founder_id: string
  period_start: string
  period_end: string
  amount: number
  distribution_date: string
  created_at: string
  updated_at: string
}

export interface FinanceSummary {
  mrr: number
  total_revenue: number
  total_expenses: number
  net_profit: number
  reserve_fund: number
  distribution_pool: number
}

export interface Forecast {
  projected_mrr: number
  projected_profit: number
  hiring_affordability: number
}
