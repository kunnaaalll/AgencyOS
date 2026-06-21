import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { discoveryApi, BulkDiscoveryJob, DiscoveryCatalog } from '../api/discoveryApi';

const SOURCE_LABELS: Record<string, string> = {
  google_maps: '🗺 Google Maps',
  google_search: '🔍 Google Search',
  justdial: '📞 JustDial',
  indiamart: '🏭 IndiaMart',
  clutch: '⭐ Clutch',
  reddit: '💬 Reddit',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  RUNNING: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
};

function ProgressBar({ value, max, color = 'bg-indigo-500' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className={`${color} h-2.5 rounded-full transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function JobCard({ job }: { job: BulkDiscoveryJob }) {
  const progress = job.total_queries > 0
    ? Math.round(((job.completed_queries + job.failed_queries) / job.total_queries) * 100)
    : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[job.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
            {job.status}
          </span>
          <span className="text-sm text-gray-500">
            {new Date(job.created_at).toLocaleString()}
          </span>
        </div>
        <div className="text-lg font-bold text-indigo-600">
          {job.businesses_discovered.toLocaleString()} found
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3 text-xs text-gray-600">
        <span className="bg-gray-100 px-2 py-1 rounded">
          {job.industries.length} industries
        </span>
        <span className="bg-gray-100 px-2 py-1 rounded">
          {job.locations.length} locations
        </span>
        <span className="bg-gray-100 px-2 py-1 rounded">
          {job.sources.length} sources
        </span>
        <span className="bg-gray-100 px-2 py-1 rounded">
          {job.limit_per_query}/query limit
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-gray-500">
          <span>{job.completed_queries} completed / {job.total_queries} total</span>
          <span>{progress}%</span>
        </div>
        <ProgressBar value={job.completed_queries + job.failed_queries} max={job.total_queries} />
        {job.failed_queries > 0 && (
          <div className="text-xs text-red-500">{job.failed_queries} failed queries</div>
        )}
      </div>
    </div>
  );
}

export function BulkDiscoveryPage() {
  const queryClient = useQueryClient();
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>(['google_maps', 'google_search']);
  const [limitPerQuery, setLimitPerQuery] = useState(10);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  // Load catalog
  const { data: catalog } = useQuery<DiscoveryCatalog>({
    queryKey: ['discovery-catalog'],
    queryFn: discoveryApi.getCatalog,
  });

  // Load bulk jobs list
  const { data: bulkJobs, refetch: refetchJobs } = useQuery({
    queryKey: ['bulk-jobs'],
    queryFn: discoveryApi.listBulkJobs,
    refetchInterval: 10000,
  });

  // Poll active job
  const { data: activeJob } = useQuery({
    queryKey: ['bulk-job', activeJobId],
    queryFn: () => discoveryApi.getBulkJob(activeJobId!),
    enabled: !!activeJobId,
    refetchInterval: (data) => {
      if (data?.status === 'RUNNING' || data?.status === 'PENDING') return 5000;
      return false;
    },
  });

  const launchMutation = useMutation({
    mutationFn: discoveryApi.bulkDiscover,
    onSuccess: (job) => {
      setActiveJobId(job.id);
      queryClient.invalidateQueries({ queryKey: ['bulk-jobs'] });
    },
  });

  const totalQueries = selectedIndustries.length * selectedLocations.length * selectedSources.length;
  const estimatedBusinesses = totalQueries * limitPerQuery;

  const toggleAll = (
    items: string[],
    selected: string[],
    setter: (v: string[]) => void
  ) => {
    if (selected.length === items.length) setter([]);
    else setter([...items]);
  };

  const toggle = (item: string, selected: string[], setter: (v: string[]) => void) => {
    if (selected.includes(item)) setter(selected.filter(i => i !== item));
    else setter([...selected, item]);
  };

  const handleLaunch = () => {
    if (!selectedIndustries.length || !selectedLocations.length || !selectedSources.length) return;
    launchMutation.mutate({
      industries: selectedIndustries,
      locations: selectedLocations,
      sources: selectedSources,
      limit_per_query: limitPerQuery,
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bulk Discovery</h1>
        <p className="text-gray-500 mt-1">
          Launch mass discovery runs across multiple industries, locations, and sources simultaneously.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="xl:col-span-2 space-y-5">
          {/* Industries */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Industries</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleAll(catalog?.industries || [], selectedIndustries, setSelectedIndustries)}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  {selectedIndustries.length === catalog?.industries.length ? 'Clear all' : 'Select all'}
                </button>
                <span className="text-xs text-gray-400">
                  {selectedIndustries.length} / {catalog?.industries.length ?? 0}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(catalog?.industries || []).map(ind => (
                <button
                  key={ind}
                  onClick={() => toggle(ind, selectedIndustries, setSelectedIndustries)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    selectedIndustries.includes(ind)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>

          {/* Locations */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Locations</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleAll(catalog?.locations || [], selectedLocations, setSelectedLocations)}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  {selectedLocations.length === catalog?.locations.length ? 'Clear all' : 'Select all'}
                </button>
                <span className="text-xs text-gray-400">
                  {selectedLocations.length} / {catalog?.locations.length ?? 0}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(catalog?.locations || []).map(loc => (
                <button
                  key={loc}
                  onClick={() => toggle(loc, selectedLocations, setSelectedLocations)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    selectedLocations.includes(loc)
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400'
                  }`}
                >
                  📍 {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Sources */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Sources</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => toggle(key, selectedSources, setSelectedSources)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
                    selectedSources.includes(key)
                      ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-violet-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Limit per query */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-800">Limit per Query</h2>
              <span className="text-2xl font-bold text-indigo-600">{limitPerQuery}</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={limitPerQuery}
              onChange={e => setLimitPerQuery(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>
        </div>

        {/* Summary + Launch Panel */}
        <div className="space-y-5">
          {/* Summary Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Discovery Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-indigo-200">Industries</span>
                <span className="font-bold">{selectedIndustries.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo-200">Locations</span>
                <span className="font-bold">{selectedLocations.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo-200">Sources</span>
                <span className="font-bold">{selectedSources.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo-200">Limit/query</span>
                <span className="font-bold">{limitPerQuery}</span>
              </div>
              <div className="border-t border-indigo-400 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-indigo-200">Total Queries</span>
                  <span className="font-bold text-xl">{totalQueries.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-indigo-200">Est. Businesses</span>
                  <span className="font-bold text-xl">{estimatedBusinesses.toLocaleString()}+</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLaunch}
              disabled={
                launchMutation.isPending ||
                !selectedIndustries.length ||
                !selectedLocations.length ||
                !selectedSources.length
              }
              className="mt-6 w-full bg-white text-indigo-600 font-bold py-3 rounded-xl hover:bg-indigo-50 transition disabled:opacity-50 disabled:cursor-not-allowed shadow"
            >
              {launchMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⟳</span> Launching...
                </span>
              ) : '🚀 Launch Bulk Discovery'}
            </button>
            {launchMutation.isError && (
              <p className="mt-2 text-red-200 text-xs text-center">
                Failed to launch. Please try again.
              </p>
            )}
          </div>

          {/* Active Job Progress */}
          {activeJob && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">Active Job</h3>
              <JobCard job={activeJob} />
            </div>
          )}
        </div>
      </div>

      {/* Recent Bulk Jobs */}
      {bulkJobs && bulkJobs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Bulk Jobs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bulkJobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
