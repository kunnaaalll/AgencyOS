import api from "@/lib/api";

export interface DiscoveryRun {
  id: string;
  source: string;
  status: string;
  query: string | null;
  location: string | null;
  started_at: string | null;
  completed_at: string | null;
  businesses_discovered: number;
  businesses_validated: number;
  businesses_created: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface RawBusiness {
  id: string;
  source: string;
  business_name: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  industry: string | null;
  rating: number | null;
  google_rating: number | null;
  review_count: number | null;
  google_maps_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  youtube_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  completeness_score: number;
  validation_status: string;
  is_duplicate: boolean;
  enriched_at: string | null;
  raw_payload: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BulkDiscoveryRequest {
  industries: string[];
  locations: string[];
  sources: string[];
  limit_per_query: number;
}

export interface BulkDiscoveryJob {
  id: string;
  status: string;
  industries: string[];
  locations: string[];
  sources: string[];
  limit_per_query: number;
  total_queries: number;
  completed_queries: number;
  failed_queries: number;
  businesses_discovered: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyDiscoveryCount {
  date: string;
  count: number;
}

export interface SourceStat {
  source: string;
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
  success_rate: number;
  avg_runtime_seconds: number;
}

export interface TopItem {
  name: string;
  count: number;
}

export interface DiscoveryMetrics {
  total_discovered: number;
  total_validated: number;
  total_promoted: number;
  validation_success_rate: number;
  duplicate_rate: number;
  promotion_rate: number;
  businesses_per_hour: number;
  daily_counts: DailyDiscoveryCount[];
  top_industries: TopItem[];
  top_locations: TopItem[];
  source_stats: SourceStat[];
}

export interface PaginatedBusinesses {
  items: RawBusiness[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface BusinessFilters {
  status?: string;
  source?: string;
  industry?: string;
  city?: string;
  min_completeness?: number;
  is_duplicate?: boolean;
  page?: number;
  limit?: number;
}

export interface DiscoveryCatalog {
  industries: string[];
  locations: string[];
  sources: string[];
}

export const discoveryApi = {
  // Single runs
  createRun: async (data: { source: string; query?: string; location?: string; limit?: number }) => {
    const res = await api.post<DiscoveryRun>("/v1/discovery/run", data);
    return res.data;
  },

  getRuns: async () => {
    const res = await api.get<DiscoveryRun[]>("/v1/discovery/runs");
    return res.data;
  },

  getRun: async (id: string) => {
    const res = await api.get<DiscoveryRun>(`/v1/discovery/runs/${id}`);
    return res.data;
  },

  // Bulk discovery
  bulkDiscover: async (payload: BulkDiscoveryRequest) => {
    const res = await api.post<BulkDiscoveryJob>("/v1/discovery/bulk", payload);
    return res.data;
  },

  getBulkJob: async (id: string) => {
    const res = await api.get<BulkDiscoveryJob>(`/v1/discovery/bulk/${id}`);
    return res.data;
  },

  listBulkJobs: async () => {
    const res = await api.get<BulkDiscoveryJob[]>("/v1/discovery/bulk");
    return res.data;
  },

  // Businesses
  getBusinesses: async (filters: BusinessFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        params.set(k, String(v));
      }
    });
    const res = await api.get<PaginatedBusinesses>(`/v1/discovery/businesses?${params}`);
    return res.data;
  },

  promoteBusiness: async (id: string) => {
    const res = await api.post(`/v1/discovery/businesses/${id}/promote`);
    return res.data;
  },

  markDuplicate: async (id: string) => {
    const res = await api.delete(`/v1/discovery/businesses/${id}/duplicate`);
    return res.data;
  },

  // Metrics
  getMetrics: async (days = 30) => {
    const res = await api.get<DiscoveryMetrics>(`/v1/discovery/metrics?days=${days}`);
    return res.data;
  },

  // Reference data
  getCatalog: async () => {
    const res = await api.get<DiscoveryCatalog>("/v1/discovery/catalog");
    return res.data;
  },
};
