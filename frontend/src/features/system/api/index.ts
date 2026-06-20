import { api } from '@/lib/api'
import { SystemHealth, AuditLog, Notification, BackupRecord, WorkflowExecution } from '../types'

// Monitoring
export const getSystemHealth = () => api.get<SystemHealth>('/api/monitoring/system').then(res => res.data)
export const getWorkflows = () => api.get<WorkflowExecution[]>('/api/monitoring/workflows').then(res => res.data)
export const getAuditLogs = () => api.get<AuditLog[]>('/api/monitoring/audit').then(res => res.data)

// Notifications
export const getNotifications = () => api.get<Notification[]>('/api/notifications').then(res => res.data)
export const markNotificationRead = (id: string) => api.patch<Notification>(`/api/notifications/${id}/read`).then(res => res.data)

// Backups
export const getBackups = () => api.get<BackupRecord[]>('/api/backups').then(res => res.data)
export const createBackup = (backupType: string) => api.post<BackupRecord>('/api/backups', { backup_type: backupType }).then(res => res.data)
