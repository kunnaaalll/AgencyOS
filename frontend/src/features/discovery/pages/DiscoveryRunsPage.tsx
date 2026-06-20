import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { discoveryApi } from '../api/discoveryApi';
import { Link } from '@tanstack/react-router';

export function DiscoveryRunsPage() {
  const queryClient = useQueryClient();
  const [source, setSource] = useState('google_maps');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [limit, setLimit] = useState(10);

  const { data: runs, isLoading } = useQuery({
    queryKey: ['discovery-runs'],
    queryFn: discoveryApi.getRuns,
  });

  const runMutation = useMutation({
    mutationFn: discoveryApi.createRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discovery-runs'] });
      setQuery('');
      setLocation('');
    },
  });

  const handleStartRun = (e: React.FormEvent) => {
    e.preventDefault();
    runMutation.mutate({ source, query, location, limit });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Discovery Runs</h1>
      
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-lg font-semibold mb-4">Start New Run</h2>
        <form onSubmit={handleStartRun} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Source</label>
            <select 
              value={source} 
              onChange={(e) => setSource(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="google_maps">Google Maps</option>
              <option value="google_search">Google Search</option>
              <option value="reddit">Reddit</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Query/Industry</label>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border rounded p-2"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Location</label>
            <input 
              type="text" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border rounded p-2"
              required
            />
          </div>
          <div className="w-24">
            <label className="block text-sm font-medium mb-1">Limit</label>
            <input 
              type="number" 
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full border rounded p-2"
              min="1"
              max="100"
            />
          </div>
          <button 
            type="submit" 
            disabled={runMutation.isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded font-medium disabled:opacity-50"
          >
            {runMutation.isPending ? 'Starting...' : 'Start Run'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium text-gray-600">Source</th>
              <th className="p-4 font-medium text-gray-600">Query</th>
              <th className="p-4 font-medium text-gray-600">Status</th>
              <th className="p-4 font-medium text-gray-600">Discovered</th>
              <th className="p-4 font-medium text-gray-600">Validated</th>
              <th className="p-4 font-medium text-gray-600">Date</th>
              <th className="p-4 font-medium text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="p-4 text-center">Loading...</td></tr>
            ) : runs?.length === 0 ? (
              <tr><td colSpan={7} className="p-4 text-center">No runs found.</td></tr>
            ) : runs?.map(run => (
              <tr key={run.id} className="border-b">
                <td className="p-4 capitalize">{run.source.replace('_', ' ')}</td>
                <td className="p-4">{run.query} {run.location ? `in ${run.location}` : ''}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    run.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    run.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {run.status}
                  </span>
                </td>
                <td className="p-4">{run.businesses_discovered}</td>
                <td className="p-4">{run.businesses_validated}</td>
                <td className="p-4">{new Date(run.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <Link to={`/discovery/runs/${run.id}`} className="text-blue-600 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
