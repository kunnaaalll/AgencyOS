import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { financeApi } from '../api'
import type { Founder, FinanceSummary } from '../types'

export function FounderPage() {
  const [founders, setFounders] = useState<Founder[]>([])
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([financeApi.getFounders(), financeApi.getSummary()])
      .then(([foundersData, summaryData]) => {
        setFounders(Array.isArray(foundersData) ? foundersData : (foundersData as any)?.items || [])
        setSummary(summaryData)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const founderList = Array.isArray(founders) ? founders : []
  const totalEquity = founderList.filter(f => f.is_active).reduce((sum, f) => sum + Number(f.equity_percentage), 0)
  const isValidEquity = Math.abs(totalEquity - 100) < 0.01

  if (isLoading) return <div className="p-8">Loading founders...</div>

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Founders & Distributions</h1>
          <p className="text-muted-foreground mt-1">Manage founder equity and view expected distributions.</p>
        </div>
        <Button>Add Founder</Button>
      </div>

      {!isValidEquity && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md border border-destructive/50">
          <strong>Configuration Error:</strong> Total active equity must equal exactly 100%. Current total is {totalEquity}%.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribution Pool</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(summary?.distribution_pool || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Equity Allocated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${isValidEquity ? 'text-emerald-600' : 'text-destructive'}`}>
              {totalEquity}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Equity %</TableHead>
              <TableHead className="text-right">Expected Distribution</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {founderList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted py-8">
                  No founders found.
                </TableCell>
              </TableRow>
            ) : founderList.map((founder) => {
              const expectedDistribution = founder.is_active && summary 
                ? summary.distribution_pool * (Number(founder.equity_percentage) / 100) 
                : 0

              return (
                <TableRow key={founder.id}>
                  <TableCell className="font-medium">{founder.name}</TableCell>
                  <TableCell>{founder.email}</TableCell>
                  <TableCell>
                    {founder.is_active ? (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-800">
                        Inactive
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{founder.equity_percentage}%</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(expectedDistribution)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
              )
            })}
            {founders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No founders found. Add your first founder to start tracking equity.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
