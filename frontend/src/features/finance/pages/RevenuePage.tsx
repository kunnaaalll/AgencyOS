import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { financeApi } from '../api'
import type { Revenue } from '../types'

export function RevenuePage() {
  const [revenues, setRevenues] = useState<Revenue[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    financeApi.getRevenues()
      .then(setRevenues)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <div className="p-8">Loading revenue records...</div>

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0)

  return (
    <div className="max-w-[1400px] mx-auto px-6 pb-24 space-y-10 mt-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-claude-display-lg text-ink">Revenue</h1>
          <p className="text-muted text-claude-body-md mt-2">Track all incoming client payments and invoices.</p>
        </div>
        <Button className="rounded-md bg-primary text-primary-foreground hover:bg-primary-active">Record Revenue</Button>
      </div>

      <Card className="bg-surface-card border-border rounded-xl shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {revenues.map((revenue) => (
              <TableRow key={revenue.id}>
                <TableCell>{revenue.received_date ? new Date(revenue.received_date).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell className="font-medium">{revenue.description || 'No description'}</TableCell>
                <TableCell>{revenue.invoice_number || '—'}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    revenue.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-800' :
                    revenue.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                    'bg-rose-100 text-rose-800'
                  }`}>
                    {revenue.status}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(revenue.amount)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">Edit</Button>
                </TableCell>
              </TableRow>
            ))}
            {revenues.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No revenue records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
