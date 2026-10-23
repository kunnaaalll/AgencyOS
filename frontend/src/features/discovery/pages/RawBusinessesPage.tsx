import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { discoveryApi } from '../api/discoveryApi';

export function RawBusinessesPage() {
  const queryClient = useQueryClient();

  const { data: businesses, isLoading } = useQuery({
    queryKey: ['raw-businesses'],
    queryFn: () => discoveryApi.getBusinesses(),
  });

  const promoteMutation = useMutation({
    mutationFn: discoveryApi.promoteBusiness,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-businesses'] });
      alert('Business promoted to lead successfully!');
    },
    onError: (error: any) => {
      alert(`Failed to promote: ${error?.response?.data?.detail || error.message}`);
    }
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Discovered Businesses</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium text-gray-600">Business</th>
              <th className="p-4 font-medium text-gray-600">Industry</th>
              <th className="p-4 font-medium text-gray-600">Website</th>
              <th className="p-4 font-medium text-gray-600">Phone</th>
              <th className="p-4 font-medium text-gray-600">Source</th>
              <th className="p-4 font-medium text-gray-600">Validation</th>
              <th className="p-4 font-medium text-gray-600">Date</th>
              <th className="p-4 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="p-4 text-center">Loading...</td></tr>
            ) : (!Array.isArray((businesses as any)?.items) || (businesses as any)?.items?.length === 0) ? (
              <tr><td colSpan={8} className="p-4 text-center">No businesses discovered yet.</td></tr>
            ) : (businesses as any)?.items?.map((business: any) => (
              <tr key={business.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">{business.business_name}</td>
                <td className="p-4 capitalize">{business.industry || '-'}</td>
                <td className="p-4">
                  {business.website ? (
                    <a href={business.website.startsWith('http') ? business.website : `https://${business.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Link
                    </a>
                  ) : '-'}
                </td>
                <td className="p-4">{business.phone || '-'}</td>
                <td className="p-4 capitalize">{business.source.replace('_', ' ')}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    business.validation_status === 'VALID' ? 'bg-green-100 text-green-800' :
                    business.validation_status === 'INVALID' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {business.validation_status}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-500">{new Date(business.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <button 
                    onClick={() => promoteMutation.mutate(business.id)}
                    disabled={promoteMutation.isPending}
                    className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Promote to Lead
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
