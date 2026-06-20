export interface SystemHealth {
  postgres_health: boolean;
  redis_health: boolean;
  minio_health: boolean;
  meilisearch_health: boolean;
  queue_depth: number;
  active_workers: number;
  failed_jobs: number;
  storage_usage: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  is_read: boolean;
  created_at: string;
}

export interface BackupRecord {
  id: string;
  backup_type: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  file_size: number | null;
  storage_location: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_name: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'RETRYING';
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
}
