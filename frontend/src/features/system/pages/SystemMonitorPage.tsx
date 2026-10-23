import { useQuery } from '@tanstack/react-query'
import { getSystemHealth, getWorkflows } from '../api'

export function SystemMonitorPage() {
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: getSystemHealth,
  })

  const { data: workflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ['system-workflows'],
    queryFn: getWorkflows,
  })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">System Monitor</h1>
      
      {healthLoading ? (
        <p className="text-gray-500">Loading system health...</p>
      ) : health ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Postgres</h3>
            <p className={`text-xl font-semibold mt-1 ${health.postgres_health ? 'text-green-500' : 'text-red-500'}`}>
              {health.postgres_health ? 'Healthy' : 'Down'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Redis</h3>
            <p className={`text-xl font-semibold mt-1 ${health.redis_health ? 'text-green-500' : 'text-red-500'}`}>
              {health.redis_health ? 'Healthy' : 'Down'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">MinIO</h3>
            <p className={`text-xl font-semibold mt-1 ${health.minio_health ? 'text-green-500' : 'text-red-500'}`}>
              {health.minio_health ? 'Healthy' : 'Down'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Meilisearch</h3>
            <p className={`text-xl font-semibold mt-1 ${health.meilisearch_health ? 'text-green-500' : 'text-red-500'}`}>
              {health.meilisearch_health ? 'Healthy' : 'Down'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Queue Depth</h3>
            <p className="text-xl font-semibold mt-1 text-gray-900 dark:text-white">{health.queue_depth}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Workers</h3>
            <p className="text-xl font-semibold mt-1 text-gray-900 dark:text-white">{health.active_workers}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Failed Jobs</h3>
            <p className="text-xl font-semibold mt-1 text-red-500">{health.failed_jobs}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Storage Usage</h3>
            <p className="text-xl font-semibold mt-1 text-blue-500">{health.storage_usage}</p>
          </div>
        </div>
      ) : null}

      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Recent Workflows</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {workflowsLoading ? (
          <div className="p-4 text-gray-500">Loading workflows...</div>
        ) : Array.isArray(workflows) && workflows.length > 0 ? (
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Workflow</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Started At</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Duration (ms)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {workflows.map((wf) => (
                <tr key={wf.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{wf.workflow_name}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      wf.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                      wf.status === 'FAILED' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                    }`}>
                      {wf.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{wf.started_at ? new Date(wf.started_at).toLocaleString() : '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{wf.duration_ms ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No workflows executed yet.
          </div>
        )}
      </div>
    </div>
  )
}
