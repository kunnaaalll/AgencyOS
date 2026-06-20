export enum ClientStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  CHURNED = "CHURNED",
  COMPLETED = "COMPLETED",
}

export enum HealthStatus {
  HEALTHY = "HEALTHY",
  AT_RISK = "AT_RISK",
  RENEWAL_DUE = "RENEWAL_DUE",
  UPSELL_OPPORTUNITY = "UPSELL_OPPORTUNITY",
}

export enum ProjectStatus {
  PLANNING = "PLANNING",
  ACTIVE = "ACTIVE",
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED",
}

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  REVIEW = "REVIEW",
  DONE = "DONE",
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export interface Client {
  id: string;
  opportunity_id?: string | null;
  business_name: string;
  primary_contact_name?: string | null;
  primary_contact_email?: string | null;
  primary_contact_phone?: string | null;
  package_type?: string | null;
  monthly_retainer: number;
  contract_start_date?: string | null;
  contract_end_date?: string | null;
  status: ClientStatus;
  health_status: HealthStatus;
  renewal_probability: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientStats {
  active_clients: number;
  monthly_retainer_revenue: number;
  at_risk_clients: number;
  renewals_due: number;
}

export interface Project {
  id: string;
  client_id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  start_date?: string | null;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}
