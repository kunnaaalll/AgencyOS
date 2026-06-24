import api from '@/lib/api'
import { SystemHealth, AuditLog, Notification, BackupRecord, WorkflowExecution } from '../types'

// Monitoring
export const getSystemHealth = () => api.get<SystemHealth>('/monitoring/system').then(res => res.data)
export const getWorkflows = () => api.get<WorkflowExecution[]>('/monitoring/workflows').then(res => res.data)
export const getAuditLogs = () => api.get<AuditLog[]>('/monitoring/audit').then(res => res.data)

// Notifications
export const getNotifications = () => api.get<Notification[]>('/notifications').then(res => res.data)
export const markNotificationRead = (id: string) => api.patch<Notification>(`/notifications/${id}/read`).then(res => res.data)

// Backups
export const getBackups = () => api.get<BackupRecord[]>('/backups').then(res => res.data)
export const createBackup = (backupType: string) => api.post<BackupRecord>('/backups', { backup_type: backupType }).then(res => res.data)
