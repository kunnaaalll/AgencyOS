import api from '@/lib/api'

export interface Lead {
  id: string
  business_name: string
  website: string | null
  industry: string | null
  city: string | null
  state: string | null
  country: string | null
  phone: string | null
  email: string | null
  instagram_url: string | null
  linkedin_url: string | null
  google_maps_url: string | null
  status: string
  score: number | null
  priority: string | null
  source: string | null
  qualification_status: string | null
  created_at: string
  updated_at: string
}

export interface LeadStats {
  total_leads: number
  qualified_leads: number
  high_priority_leads: number
}

export interface LeadAnalysis {
  id: string
  lead_id: string
  website_score: number | null
  seo_score: number | null
  instagram_score: number | null
  reviews_score: number | null
  cta_score: number | null
  digital_maturity_score: number | null
  total_score: number | null
  summary: string | null
  pain_points: string[]
  strengths: string[]
  weaknesses: string[]
  analyzed_at: string | null
  created_at: string
  updated_at: string
}

export const fetchLeads = async (): Promise<Lead[]> => {
  const { data } = await api.get('/api/v1/leads')
  return data
}

export const fetchLeadStats = async (): Promise<LeadStats> => {
  const { data } = await api.get('/api/v1/leads/stats')
  return data
}

export const fetchLeadById = async (id: string): Promise<Lead> => {
  const { data } = await api.get(`/api/v1/leads/${id}`)
  return data
}

export const fetchLeadAnalysisById = async (leadId: string): Promise<LeadAnalysis> => {
  const { data } = await api.get(`/api/v1/analysis/${leadId}`)
  return data
}
