import { useQuery } from '@tanstack/react-query'
import { getAuditLogs } from '../api'

export function AuditLogPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: getAuditLogs,
  })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Audit Log</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-4 text-gray-500">Loading audit logs...</div>
        ) : logs && logs.length > 0 ? (
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Timestamp</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">User ID</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Entity</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white" title={log.user_id || 'System'}>
                    {log.user_id ? log.user_id.slice(0, 8) + '...' : 'System'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{log.entity_type} {log.entity_id ? `(${log.entity_id.slice(0, 8)})` : ''}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      log.action === 'CREATE' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                      log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                      log.action === 'DELETE' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No audit logs found.
          </div>
        )}
      </div>
    </div>
  )
}
