import { useQuery } from '@tanstack/react-query'
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
import { useState } from 'react'
import { fetchLeads, type Lead } from '../api'
import { Link } from '@tanstack/react-router'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'

const columnHelper = createColumnHelper<Lead>()

const columns = [
  columnHelper.accessor('business_name', {
    header: 'Business',
    cell: info => (
      <Link to={`/leads/${info.row.original.id}`} className="font-medium text-blue-600 hover:underline">
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor('industry', {
    header: 'Industry',
    cell: info => info.getValue() || '-',
  }),
  columnHelper.accessor('city', {
    header: 'City',
    cell: info => info.getValue() || '-',
  }),
  columnHelper.accessor('source', {
    header: 'Source',
    cell: info => info.getValue() || '-',
  }),
  columnHelper.accessor('score', {
    header: 'Score',
    cell: info => (
      <div className="flex items-center gap-2">
        <div className="w-full bg-surface-200 rounded-full h-2 max-w-[60px]">
          <div
            className="bg-blue-600 h-2 rounded-full"
            style={{ width: `${info.getValue() || 0}%` }}
          />
        </div>
        <span className="text-sm">{info.getValue() || 0}</span>
      </div>
    ),
  }),
  columnHelper.accessor('priority', {
    header: 'Priority',
    cell: info => {
      const priority = info.getValue()
      if (!priority) return '-'
      const colors: Record<string, string> = {
        HIGH: 'bg-red-100 text-red-700',
        MEDIUM: 'bg-amber-100 text-amber-700',
        LOW: 'bg-green-100 text-green-700',
      }
      return (
        <span className={`px-2 py-1 rounded-md text-xs font-medium ${colors[priority] || 'bg-surface-100 text-surface-700'}`}>
          {priority}
        </span>
      )
    },
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: info => (
      <span className="px-2 py-1 bg-surface-100 text-surface-700 rounded-md text-xs font-medium">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('created_at', {
    header: 'Created',
    cell: info => new Date(info.getValue()).toLocaleDateString(),
  }),
]

export function LeadsListPage() {
  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: fetchLeads,
  })

  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data: leads || [],
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Leads</h2>
          <p className="text-surface-500 mt-0.5 text-sm">Manage and qualify discovered businesses</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search leads..."
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            className="pl-9 pr-4 py-2 border border-surface-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-surface-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-50 text-surface-600 border-b border-surface-200">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="px-4 py-3 font-medium whitespace-nowrap">
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
                            asc: <ChevronUp className="w-4 h-4" />,
                            desc: <ChevronDown className="w-4 h-4" />,
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-surface-200">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-surface-500">
                    Loading leads...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-surface-500">
                    No leads found.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-surface-50 transition-colors">
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 bg-surface-50">
          <div className="text-sm text-surface-500">
            Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} leads
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 border border-surface-200 rounded-md bg-white disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 border border-surface-200 rounded-md bg-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
