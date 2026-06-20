export enum PipelineStage {
  NEW = 'NEW',
  QUALIFIED = 'QUALIFIED',
  CONTACTED = 'CONTACTED',
  MEETING = 'MEETING',
  PROPOSAL = 'PROPOSAL',
  WON = 'WON',
  LOST = 'LOST',
}

export enum ActivityType {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  LINKEDIN = 'LINKEDIN',
  NOTE = 'NOTE',
  FOLLOW_UP = 'FOLLOW_UP',
  MEETING = 'MEETING',
}

export enum MeetingType {
  DISCOVERY = 'DISCOVERY',
  STRATEGY = 'STRATEGY',
  FOLLOW_UP = 'FOLLOW_UP',
  CLOSING = 'CLOSING',
}

export interface Opportunity {
  id: string;
  lead_id: string;
  title: string;
  pipeline_stage: PipelineStage;
  value: number;
  probability: number;
  owner_id?: string;
  expected_close_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  opportunity_id: string;
  user_id: string;
  activity_type: ActivityType;
  title: string;
  description?: string;
  scheduled_for?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  opportunity_id: string;
  meeting_type: MeetingType;
  scheduled_at: string;
  duration_minutes: number;
  location?: string;
  meeting_notes?: string;
  outcome?: string;
  created_at: string;
  updated_at: string;
}

export interface CRMStats {
  pipeline_value: number;
  weighted_pipeline_value: number;
  meetings_scheduled: number;
  won_opportunities: number;
  lost_opportunities: number;
  conversion_rate: number;
}
