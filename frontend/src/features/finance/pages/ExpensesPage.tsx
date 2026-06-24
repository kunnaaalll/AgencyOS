import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { financeApi } from '../api'
import type { Expense } from '../types'

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    financeApi.getExpenses()
      .then(setExpenses)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <div className="p-8">Loading expense records...</div>

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0)

  return (
    <div className="max-w-[1400px] mx-auto px-6 pb-24 space-y-10 mt-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-claude-display-lg text-ink">Expenses</h1>
          <p className="text-muted text-claude-body-md mt-2">Track company expenses and vendor payments.</p>
        </div>
        <Button className="rounded-md bg-primary text-primary-foreground hover:bg-primary-active">Log Expense</Button>
      </div>

      <Card className="bg-surface-card border-border rounded-xl shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description / Vendor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-800">
                    {expense.category}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{expense.description || 'No description'}</div>
                  <div className="text-xs text-muted-foreground">{expense.vendor || 'Unknown vendor'}</div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    expense.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {expense.status}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(expense.amount)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">Edit</Button>
                </TableCell>
              </TableRow>
            ))}
            {expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No expense records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
