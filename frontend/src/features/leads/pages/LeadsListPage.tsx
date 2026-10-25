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
  Users,
  LayoutTemplate,
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
    queryFn: () => fetchLeads(),
  })

  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [cleanOnly, setCleanOnly] = useState(false)

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
    return leads.filter((l) => Boolean(l.phone || l.website || l.email))
  }, [leads, cleanOnly])

  const columnHelper = createColumnHelper<Lead>()

  const columns = useMemo(
    () => [
      columnHelper.accessor('business_name', {
        header: 'Business Name',
        cell: (info) => {
          const lead = info.row.original
          const isClean = Boolean(lead.phone && lead.website)
          return (
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Link
                  to="/leads/$id"
                  params={{ id: lead.id }}
                  className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate block text-xs"
                  title={info.getValue()}
                >
                  {info.getValue()}
                </Link>
                {isClean && (
                  <span title="100% Clean Data Verified" className="shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  </span>
                )}
              </div>
              {lead.website && (
                <a
                  href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-zinc-400 hover:text-indigo-600 flex items-center gap-1 mt-0.5 truncate"
                  title={lead.website}
                >
                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{lead.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                </a>
              )}
            </div>
          )
        },
      }),
      columnHelper.accessor('industry', {
        header: 'Niche',
        cell: (info) => (
          <div className="truncate pr-1">
            <span
              className="capitalize px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-medium truncate inline-block max-w-full"
              title={info.getValue() || 'General'}
            >
              {info.getValue() || 'General'}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('city', {
        header: 'Location',
        cell: (info) => (
          <span
            className="text-xs text-zinc-600 dark:text-zinc-400 truncate block pr-1"
            title={info.getValue() || 'India'}
          >
            {info.getValue() || 'India'}
          </span>
        ),
      }),
      columnHelper.accessor('phone', {
        header: 'Contact & WhatsApp',
        cell: (info) => {
          const phone = info.getValue()
          const lead = info.row.original
          if (!phone) return <span className="text-zinc-400 italic text-[11px]">Missing Phone</span>

          const cleanDigits = phone.replace(/[^\d+]/g, '')
          const waNum = cleanDigits.startsWith('+')
            ? cleanDigits.slice(1)
            : cleanDigits.length === 10
            ? `91${cleanDigits}`
            : cleanDigits
          const hook = encodeURIComponent(
            `Hi ${lead.business_name} team, noticed a couple conversion leaks on your website. Can I share a quick 60-second video teardown?`
          )

          return (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate font-mono">
                {phone}
              </span>
              <a
                href={`https://wa.me/${waNum}?text=${hook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 transition-colors shrink-0"
                title="1-Click WhatsApp Pitch"
              >
                <MessageCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              </a>
              <a
                href={`tel:${cleanDigits}`}
                className="p-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 transition-colors shrink-0"
                title="Direct Phone Call"
              >
                <Phone className="w-3 h-3 text-zinc-500" />
              </a>
            </div>
          )
        },
      }),
      columnHelper.accessor('score', {
        header: 'Buying Power Tier',
        cell: (info) => {
          const score = info.getValue() || 75
          const isEnt = score >= 88
          return (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold shrink-0 ${
                isEnt
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
              }`}
            >
              <Flame className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
              {isEnt ? '₹50k-₹1L/mo' : '₹25k-₹50k/mo'}
            </span>
          )
        },
      }),
      columnHelper.accessor('status', {
        header: 'Tracking Stage',
        cell: (info) => {
          const lead = info.row.original
          return (
            <select
              value={info.getValue()}
              onChange={(e) => statusMutation.mutate({ id: lead.id, status: e.target.value })}
              className="text-[11px] font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md px-1.5 py-1 text-zinc-800 dark:text-zinc-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full truncate"
            >
              {STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          )
        },
      }),
      columnHelper.accessor('id', {
        header: 'Audit & Pitch',
        cell: (info) => {
          const lead = info.row.original
          const hasWebsite = !!lead.website

          return (
            <Link
              to="/leads/$id/analysis"
              params={{ id: info.getValue() }}
              className={`inline-flex items-center justify-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md border transition-colors shrink-0 w-full ${
                hasWebsite
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
                  : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100'
              }`}
              title={hasWebsite ? 'Inspect Playwright Website Audit' : 'Offline Prospect: View Website Creation Offer & Pitch'}
            >
              {hasWebsite ? (
                <>
                  <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
                  Audit
                </>
              ) : (
                <>
                  <LayoutTemplate className="w-3 h-3 text-purple-600 shrink-0" />
                  Pitch Web
                </>
              )}
            </Link>
          )
        },
      }),
    ],
    [statusMutation]
  )

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
        pageSize: 10,
      },
    },
  })

  // Width mapping for the 7 columns to ensure zero horizontal scroll
  const colWidths = ['w-[27%]', 'w-[13%]', 'w-[11%]', 'w-[18%]', 'w-[13%]', 'w-[11%]', 'w-[7%]']

  return (
    <div className="w-full space-y-3 pb-2">
      {/* Top Bar with Title, Counts and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Leads Directory
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {filteredData.length} Records
              </span>
            </h1>
            <p className="text-zinc-500 text-[11px]">
              Active business records targeted for digital marketing & growth retainers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Strict Clean Data Toggle */}
          <label className="flex items-center gap-2 cursor-pointer bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 select-none">
            <input
              type="checkbox"
              checked={cleanOnly}
              onChange={(e) => setCleanOnly(e.target.checked)}
              className="w-3.5 h-3.5 text-emerald-600 rounded"
            />
            <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Clean Data Only
            </span>
          </label>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs w-52 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>
      </div>

      {/* Leads Table Container — Perfectly fitted with table-fixed */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xs border border-zinc-200 dark:border-zinc-800 overflow-hidden w-full">
        <div className="w-full overflow-x-hidden">
          <table className="w-full text-xs text-left table-fixed">
            <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header, idx) => (
                    <th
                      key={header.id}
                      className={`px-3 py-2.5 font-semibold text-zinc-700 dark:text-zinc-300 ${
                        colWidths[idx] || ''
                      } overflow-hidden`}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? 'cursor-pointer select-none flex items-center gap-1'
                              : '',
                            onClick: header.column.getToggleSortingHandler(),
                          }}
                        >
                          <span className="truncate">{flexRender(header.column.columnDef.header, header.getContext())}</span>
                          {{
                            asc: <ChevronUp className="w-3 h-3 shrink-0" />,
                            desc: <ChevronDown className="w-3 h-3 shrink-0" />,
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-8 text-center text-zinc-500">
                    Loading qualified leads...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-8 text-center text-zinc-500">
                    No leads found matching current criteria.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    {row.getVisibleCells().map((cell, idx) => (
                      <td
                        key={cell.id}
                        className={`px-3 py-2 ${colWidths[idx] || ''} overflow-hidden align-middle`}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Compact Pagination Bar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40">
          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            <span>
              Showing{' '}
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {table.getRowModel().rows.length}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {table.getFilteredRowModel().rows.length}
              </span>{' '}
              leads
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <label className="flex items-center gap-1">
              <span>Per page:</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5 text-[11px] text-zinc-700 dark:text-zinc-300"
              >
                {[10, 25, 50, 100, 250, 500].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-500 mr-2">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
            </span>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-2.5 py-1 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-2.5 py-1 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
