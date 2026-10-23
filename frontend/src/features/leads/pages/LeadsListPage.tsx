import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type SortingState,
} from '@tanstack/react-table'
import { useState, useMemo } from 'react'
import { fetchLeads, updateLead, type Lead } from '../api'
import { Link } from '@tanstack/react-router'
import {
  Search,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Phone,
  MessageCircle,
  ExternalLink,
  Flame,
  Sparkles,
} from 'lucide-react'

const STAGES = [
  { key: 'NEW', label: '1. Cleaned' },
  { key: 'ANALYZED', label: '2. Audited' },
  { key: 'CONTACTED', label: '3. Contacted' },
  { key: 'MEETING', label: '4. Meeting' },
  { key: 'PROPOSAL', label: '5. Proposal' },
  { key: 'WON', label: '6. Won 🏆' },
  { key: 'LOST', label: 'Disqualified' },
]

export function LeadsListPage() {
  const queryClient = useQueryClient()
  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => fetchLeads(true),
  })

  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [cleanOnly, setCleanOnly] = useState(true)

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await updateLead(id, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })

  // Filter out incomplete data if cleanOnly is active
  const filteredData = useMemo(() => {
    if (!Array.isArray(leads)) return []
    if (!cleanOnly) return leads
    return leads.filter(l => Boolean(l.phone && l.website))
  }, [leads, cleanOnly])

  const columnHelper = createColumnHelper<Lead>()

  const columns = useMemo(() => [
    columnHelper.accessor('business_name', {
      header: 'Business Name',
      cell: info => {
        const lead = info.row.original
        const isClean = Boolean(lead.phone && lead.website)
        return (
          <div>
            <div className="flex items-center gap-1.5">
              <Link to="/leads/$id" params={{ id: lead.id }} className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                {info.getValue()}
              </Link>
              {isClean && (
                <span title="100% Clean Data Verified">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </span>
              )}
            </div>
            {lead.website && (
              <a
                href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-gray-400 hover:text-blue-600 flex items-center gap-1 mt-0.5"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                {lead.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        )
      },
    }),
    columnHelper.accessor('industry', {
      header: 'Niche',
      cell: info => (
        <span className="capitalize px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
          {info.getValue() || 'General'}
        </span>
      ),
    }),
    columnHelper.accessor('city', {
      header: 'Location',
      cell: info => info.getValue() || 'India',
    }),
    columnHelper.accessor('phone', {
      header: 'Contact & WhatsApp',
      cell: info => {
        const phone = info.getValue()
        const lead = info.row.original
        if (!phone) return <span className="text-gray-400 italic text-xs">Missing Phone</span>

        const cleanDigits = phone.replace(/[^\d+]/g, '')
        const waNum = cleanDigits.startsWith('+') ? cleanDigits.slice(1) : cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits
        const hook = encodeURIComponent(`Hi ${lead.business_name} team, noticed a couple conversion leaks on your website. Can I share a quick 60-second video teardown?`)

        return (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-800">{phone}</span>
            <a
              href={`https://wa.me/${waNum}?text=${hook}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
              title="1-Click WhatsApp Pitch"
            >
              <MessageCircle className="w-3 h-3 text-emerald-700" />
            </a>
            <a
              href={`tel:${cleanDigits}`}
              className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              title="Direct Phone Call"
            >
              <Phone className="w-3 h-3 text-gray-600" />
            </a>
          </div>
        )
      },
    }),
    columnHelper.accessor('score', {
      header: 'Buying Power Tier',
      cell: info => {
        const score = info.getValue() || 75
        const isEnt = score >= 88
        return (
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
              isEnt ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
            }`}>
              <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
              {isEnt ? '₹50k-₹1L/mo' : '₹25k-₹50k/mo'}
            </span>
          </div>
        )
      },
    }),
    columnHelper.accessor('status', {
      header: 'Tracking Stage',
      cell: info => {
        const lead = info.row.original
        return (
          <select
            value={info.getValue()}
            onChange={e => statusMutation.mutate({ id: lead.id, status: e.target.value })}
            className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-700 cursor-pointer focus:outline-none"
          >
            {STAGES.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        )
      },
    }),
    columnHelper.accessor('id', {
      header: 'AI Pitch',
      cell: info => (
        <Link
          to="/leads/$id/analysis"
          params={{ id: info.getValue() }}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors"
        >
          <Sparkles className="w-3 h-3 text-orange-500" />
          Audit
        </Link>
      ),
    }),
  ], [statusMutation])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-950">High-Ticket Leads Directory</h2>
          <p className="text-gray-500 mt-0.5 text-xs">
            Qualified business records targeting ₹25,000 – ₹1,00,000/mo agency retainers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Strict Clean Data Toggle */}
          <label className="flex items-center gap-2 cursor-pointer bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <input
              type="checkbox"
              checked={cleanOnly}
              onChange={e => setCleanOnly(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              100% Clean Data (Hide Incomplete)
            </span>
          </label>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs w-64 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50/80 text-gray-600 border-b border-gray-200">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="px-4 py-3 font-semibold whitespace-nowrap">
                      {header.isPlaceholder ? null : (
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? 'cursor-pointer select-none flex items-center gap-1'
                              : '',
                            onClick: header.column.getToggleSortingHandler(),
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: <ChevronUp className="w-3.5 h-3.5" />,
                            desc: <ChevronDown className="w-3.5 h-3.5" />,
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                    Loading qualified leads...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                    No leads found matching current criteria.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/50">
          <div className="text-xs text-gray-500">
            Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} leads
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 border border-gray-200 rounded-md bg-white text-xs disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 border border-gray-200 rounded-md bg-white text-xs disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
