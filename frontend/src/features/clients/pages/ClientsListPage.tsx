import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { clientsApi } from '../api';
import { type Client, HealthStatus, ClientStatus } from '../types';
import { Link } from '@tanstack/react-router';
import { Search, ChevronDown, ChevronUp, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { AddClientModal } from '../components/AddClientModal';
import { EditClientModal } from '../components/EditClientModal';

const columnHelper = createColumnHelper<Client>();

const columns = [
  columnHelper.accessor('business_name', {
    header: 'Business Name',
    cell: info => (
      <Link to="/clients/$id" params={{ id: info.row.original.id }} className="font-medium text-blue-600 hover:underline">
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor('package_type', {
    header: 'Package',
    cell: info => info.getValue() || '-',
  }),
  columnHelper.accessor('monthly_retainer', {
    header: 'Retainer',
    cell: info => `₹${(info.getValue() || 0).toLocaleString()}`,
  }),
  columnHelper.accessor('health_status', {
    header: 'Health Status',
    cell: info => {
      const status = info.getValue();
      const colors: Record<string, string> = {
        HEALTHY: 'bg-green-100 text-green-700',
        AT_RISK: 'bg-red-100 text-red-700',
        RENEWAL_DUE: 'bg-amber-100 text-amber-700',
        UPSELL_OPPORTUNITY: 'bg-blue-100 text-blue-700',
      };
      return (
        <span className={`px-2 py-1 rounded-md text-xs font-medium ${colors[status] || 'bg-surface-100 text-surface-700'}`}>
          {status.replace('_', ' ')}
        </span>
      );
    },
  }),
  columnHelper.accessor('renewal_probability', {
    header: 'Renewal Prob',
    cell: info => `${info.getValue()}%`,
  }),
  columnHelper.accessor('contract_end_date', {
    header: 'Contract End',
    cell: info => {
      const val = info.getValue();
      return val ? new Date(val).toLocaleDateString() : '-';
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
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: info => {
      const { onEdit, onDelete } = info.table.options.meta as { onEdit: (c: Client) => void, onDelete: (id: string) => void };
      return (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onEdit(info.row.original)}
            className="p-1 text-surface-400 hover:text-blue-600 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(info.row.original.id)}
            className="p-1 text-surface-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      );
    }
  })
];

export function ClientsListPage() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsApi.getClients,
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    try {
      await clientsApi.deleteClient(id);
      queryClient.setQueryData(['clients'], (oldData: Client[] | undefined) => {
        return oldData?.filter(c => c.id !== id) || [];
      });
    } catch (error) {
      console.error('Failed to delete client:', error);
      alert((error as any)?.response?.data?.detail || (error as any)?.message || 'An error occurred. Please try again.');
      alert('Failed to delete client');
    }
  };

  const table = useReactTable({
    data: clients || [],
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
    meta: {
      onEdit: setEditingClient,
      onDelete: handleDelete
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Clients</h2>
          <p className="text-surface-500 mt-0.5 text-sm">Manage active clients and delivery health</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(e.target.value)}
              className="pl-9 pr-4 py-2 border border-surface-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </button>
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
                    Loading clients...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-surface-500">
                    No clients found.
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
        
        <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 bg-surface-50">
          <div className="text-sm text-surface-500">
            Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} clients
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
      
      <AddClientModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSubmit={async (newClient) => {
          const client = await clientsApi.createClient(newClient);
          queryClient.setQueryData(['clients'], (oldData: Client[] | undefined) => {
            return [client, ...(oldData || [])];
          });
        }} 
      />

      <EditClientModal
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
        client={editingClient}
        onSubmit={async (id, updatedData) => {
          const updatedClient = await clientsApi.updateClient(id, updatedData);
          queryClient.setQueryData(['clients'], (oldData: Client[] | undefined) => {
            return oldData?.map(c => c.id === id ? updatedClient : c) || [];
          });
        }}
      />
    </div>
  );
}
