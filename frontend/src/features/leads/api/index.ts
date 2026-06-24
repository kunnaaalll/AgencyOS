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
  is_published: boolean
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

export const fetchLeads = async (is_published?: boolean, min_score?: number): Promise<Lead[]> => {
  const params = new URLSearchParams()
  if (is_published !== undefined) params.append('is_published', String(is_published))
  if (min_score !== undefined) params.append('min_score', String(min_score))
  
  const queryString = params.toString()
  const url = queryString ? `/leads?${queryString}` : '/leads'
  
  const { data } = await api.get(url)
  return data
}

export const publishLead = async (id: string): Promise<Lead> => {
  const { data } = await api.post(`/leads/${id}/publish`)
  return data
}

export const fetchLeadStats = async (): Promise<LeadStats> => {
  const { data } = await api.get('/leads/stats')
  return data
}

export const fetchLeadById = async (id: string): Promise<Lead> => {
  const { data } = await api.get(`/leads/${id}`)
  return data
}

export const fetchLeadAnalysisById = async (leadId: string): Promise<LeadAnalysis> => {
  const { data } = await api.get(`/analysis/${leadId}`)
  return data
}

// ── Discovery APIs ─────────────────────────────────────────────────────────────

export interface RawBusiness {
  id: string
  business_name: string
  website: string | null
  industry: string | null
  email: string | null
  phone: string | null
  validation_status: string
  completeness_score: number
  created_at: string
}

export interface PaginatedBusinessesResponse {
  items: RawBusiness[]
  total: number
  page: number
  limit: number
  pages: number
}

export const fetchDiscoveredBusinesses = async (page = 1, limit = 50, status?: string): Promise<PaginatedBusinessesResponse> => {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
  if (status) params.append('status', status)
  const { data } = await api.get(`/discovery/businesses?${params.toString()}`)
  return data
}

export const runDiscovery = async (source: string, location: string, limit: number = 10) => {
  const { data } = await api.post('/discovery/run', { source, location, limit })
  return data
}

export const promoteBusiness = async (businessId: string) => {
  const { data } = await api.post(`/discovery/businesses/${businessId}/promote`)
  return data
}

