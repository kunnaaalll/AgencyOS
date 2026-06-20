import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBackups, createBackup } from '../api'
import { useState } from 'react'

export function BackupPage() {
  const queryClient = useQueryClient()
  const [backupType, setBackupType] = useState('FULL')

  const { data: backups, isLoading } = useQuery({
    queryKey: ['backups'],
    queryFn: getBackups,
  })

  const { mutate: triggerBackup, isPending } = useMutation({
    mutationFn: () => createBackup(backupType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] })
    }
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Backups</h1>
        <div className="flex space-x-3">
          <select 
            value={backupType}
            onChange={(e) => setBackupType(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="FULL">Full Backup</option>
            <option value="POSTGRES_ONLY">Postgres Only</option>
            <option value="REDIS_ONLY">Redis Only</option>
          </select>
          <button 
            onClick={() => triggerBackup()}
            disabled={isPending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50 text-sm"
          >
            {isPending ? 'Triggering...' : 'Trigger Backup'}
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-4 text-gray-500">Loading backups...</div>
        ) : backups && backups.length > 0 ? (
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Type</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">File Size</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Started At</th>
                <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Completed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {backups.map((backup) => (
                <tr key={backup.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{backup.backup_type}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      backup.status === 'SUCCESS' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                      backup.status === 'FAILED' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                      backup.status === 'RUNNING' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {backup.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{backup.file_size ? `${(backup.file_size / 1024 / 1024).toFixed(2)} MB` : '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{backup.started_at ? new Date(backup.started_at).toLocaleString() : '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{backup.completed_at ? new Date(backup.completed_at).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No backups recorded yet.
          </div>
        )}
      </div>
    </div>
  )
}
