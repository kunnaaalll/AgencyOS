import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { discoveryApi } from '../api/discoveryApi';
import { useParams, Link } from '@tanstack/react-router';

export function DiscoveryRunDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };

  const { data: run, isLoading } = useQuery({
    queryKey: ['discovery-run', id],
    queryFn: () => discoveryApi.getRun(id),
  });

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!run) return <div className="p-6">Run not found.</div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/discovery/runs" className="text-blue-600 hover:underline">
          &larr; Back to Runs
        </Link>
        <h1 className="text-2xl font-bold">Discovery Run Details</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Run Information</h2>
          <div className="space-y-2">
            <p><span className="font-medium text-gray-500 w-32 inline-block">ID:</span> {run.id}</p>
            <p><span className="font-medium text-gray-500 w-32 inline-block">Source:</span> <span className="capitalize">{run.source.replace('_', ' ')}</span></p>
            <p><span className="font-medium text-gray-500 w-32 inline-block">Status:</span> {run.status}</p>
            <p><span className="font-medium text-gray-500 w-32 inline-block">Query:</span> {run.query}</p>
            <p><span className="font-medium text-gray-500 w-32 inline-block">Location:</span> {run.location}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Results & Timing</h2>
          <div className="space-y-2">
            <p><span className="font-medium text-gray-500 w-48 inline-block">Businesses Discovered:</span> {run.businesses_discovered}</p>
            <p><span className="font-medium text-gray-500 w-48 inline-block">Businesses Validated:</span> {run.businesses_validated}</p>
            <p><span className="font-medium text-gray-500 w-48 inline-block">Businesses Promoted:</span> {run.businesses_created}</p>
            <p><span className="font-medium text-gray-500 w-48 inline-block">Started At:</span> {run.started_at ? new Date(run.started_at).toLocaleString() : 'N/A'}</p>
            <p><span className="font-medium text-gray-500 w-48 inline-block">Completed At:</span> {run.completed_at ? new Date(run.completed_at).toLocaleString() : 'N/A'}</p>
          </div>
        </div>
      </div>
      
      {run.error_message && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-8">
          <h3 className="font-semibold mb-2">Error Details</h3>
          <p>{run.error_message}</p>
        </div>
      )}
      
      <div className="flex justify-end">
         <Link to="/discovery/businesses" className="bg-blue-600 text-white px-4 py-2 rounded font-medium">
            View All Discovered Businesses
         </Link>
      </div>
    </div>
  );
}
