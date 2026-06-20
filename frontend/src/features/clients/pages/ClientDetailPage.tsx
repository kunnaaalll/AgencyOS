import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from '@tanstack/react-router';
import { clientsApi } from '../api';
import { type Project } from '../types';

export function ClientDetailPage() {
  const { id } = useParams({ strict: false });

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsApi.getClient(id as string),
    enabled: !!id,
  });

  const { data: projects } = useQuery({
    queryKey: ['client-projects', id],
    queryFn: () => clientsApi.getProjects(id as string),
    enabled: !!id,
  });

  if (isLoading) return <div className="p-8">Loading client details...</div>;
  if (!client) return <div className="p-8">Client not found</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">{client.business_name}</h2>
          <p className="text-surface-500 mt-0.5 text-sm">Status: {client.status}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-surface-200 p-6">
            <h3 className="font-semibold text-surface-900 mb-4">Overview</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-surface-500">Primary Contact</span>
                <p className="font-medium">{client.primary_contact_name || '-'}</p>
              </div>
              <div>
                <span className="text-surface-500">Email</span>
                <p className="font-medium">{client.primary_contact_email || '-'}</p>
              </div>
              <div>
                <span className="text-surface-500">Phone</span>
                <p className="font-medium">{client.primary_contact_phone || '-'}</p>
              </div>
              <div>
                <span className="text-surface-500">Package</span>
                <p className="font-medium">{client.package_type || '-'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-surface-200 p-6">
            <h3 className="font-semibold text-surface-900 mb-4">Projects</h3>
            <div className="space-y-4">
              {projects?.length === 0 && <p className="text-sm text-surface-500">No active projects.</p>}
              {projects?.map((project: Project) => (
                <div key={project.id} className="flex items-center justify-between p-4 bg-surface-50 rounded-lg border border-surface-100">
                  <div>
                    <h4 className="font-medium text-surface-900">{project.name}</h4>
                    <p className="text-xs text-surface-500">{project.status}</p>
                  </div>
                  <Link
                    to="/projects/$id/board"
                    params={{ id: project.id }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                  >
                    View Board
                  </Link>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-surface-200 p-6">
            <h3 className="font-semibold text-surface-900 mb-4">Notes</h3>
            <p className="text-sm text-surface-600 whitespace-pre-wrap">{client.notes || 'No notes available.'}</p>
          </div>
        </div>

        <div className="col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-surface-200 p-6">
            <h3 className="font-semibold text-surface-900 mb-4">Renewal Information</h3>
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-surface-500">Retainer</span>
                <p className="font-bold text-lg">${client.monthly_retainer.toLocaleString()}/mo</p>
              </div>
              <div>
                <span className="text-surface-500">Health Status</span>
                <p className="font-medium">{client.health_status.replace('_', ' ')}</p>
              </div>
              <div>
                <span className="text-surface-500">Renewal Probability</span>
                <p className="font-medium">{client.renewal_probability}%</p>
              </div>
              <div>
                <span className="text-surface-500">Contract Start</span>
                <p className="font-medium">{client.contract_start_date ? new Date(client.contract_start_date).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <span className="text-surface-500">Contract End</span>
                <p className="font-medium">{client.contract_end_date ? new Date(client.contract_end_date).toLocaleDateString() : '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
