import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { getNotifications, markNotificationRead } from '../api'

export function NotificationsPage() {
  const queryClient = useQueryClient()
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  })

  const { mutate: markRead } = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
        {notifications && notifications.filter(n => !n.is_read).length > 0 && (
          <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
            {notifications.filter(n => !n.is_read).length} Unread
          </span>
        )}
      </div>
      
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-gray-500">Loading notifications...</div>
        ) : notifications && notifications.length > 0 ? (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`p-4 rounded-xl border ${notif.is_read ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 opacity-70' : 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30'}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${
                      notif.type === 'SUCCESS' ? 'bg-green-500' :
                      notif.type === 'ERROR' ? 'bg-red-500' :
                      notif.type === 'WARNING' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}></span>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{notif.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(notif.created_at).toLocaleString()}</p>
                </div>
                {!notif.is_read && (
                  <button 
                    onClick={() => markRead(notif.id)}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400">
            No notifications. You're all caught up!
          </div>
        )}
      </div>
    </div>
  )
}
