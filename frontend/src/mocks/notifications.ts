import { Notification } from '../features/system/types';

export const mockNotificationsList: Notification[] = [
  {
    id: 'notif-1',
    user_id: 'me',
    title: 'New Lead Qualified',
    message: 'Acme Corp has been moved to Qualified by Sarah.',
    type: 'SUCCESS',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString()
  },
  {
    id: 'notif-2',
    user_id: 'me',
    title: 'Invoice Overdue',
    message: 'TechFlow Inc invoice INV-004 is 3 days overdue.',
    type: 'WARNING',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
  },
  {
    id: 'notif-3',
    user_id: 'me',
    title: 'System Maintenance',
    message: 'Scheduled downtime at 2 AM EST on Sunday.',
    type: 'INFO',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
  }
];