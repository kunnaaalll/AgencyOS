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

export interface CrawlerStatus {
  status: string;
  is_running: boolean;
  is_crawling: boolean;
  mode: string;
  interval_minutes: number;
  schedule: string;
  sectors_monitored: number;
  locations_monitored: number;
  system_health: {
    worker_daemon: string;
    redis_connected: boolean;
    browser_pool: string;
    pipeline_state: string;
  };
  metrics: {
    active_runs: number;
    total_runs: number;
    total_discovered: number;
    total_validated: number;
    validation_rate: number;
  };
  last_crawl: {
    id: string | null;
    source: string;
    query: string | null;
    location: string | null;
    status: string;
    created_at: string | null;
    discovered: number;
    validated: number;
  } | null;
  next_sweep_seconds: number;
}

export const discoveryApi = {
  // 24/7 Crawler Status & Trigger
  getCrawlerStatus: async () => {
    const res = await api.get<CrawlerStatus>("/discovery/crawler/status");
    return res.data;
  },

  triggerCrawlerSweep: async () => {
    const res = await api.post<{ message: string; job_id: string; sectors: string[]; locations: string[] }>(
      "/discovery/crawler/sweep"
    );
    return res.data;
  },

  // Single runs
  createRun: async (data: { source: string; query?: string; location?: string; limit?: number }) => {
    const res = await api.post<DiscoveryRun>("/discovery/run", data);
    return res.data;
  },

  getRuns: async () => {
    const res = await api.get<DiscoveryRun[]>("/discovery/runs");
    return res.data;
  },

  getRun: async (id: string) => {
    const res = await api.get<DiscoveryRun>(`/discovery/runs/${id}`);
    return res.data;
  },

  // Bulk discovery
  bulkDiscover: async (payload: BulkDiscoveryRequest) => {
    const res = await api.post<BulkDiscoveryJob>("/discovery/bulk", payload);
    return res.data;
  },

  getBulkJob: async (id: string) => {
    const res = await api.get<BulkDiscoveryJob>(`/discovery/bulk/${id}`);
    return res.data;
  },

  listBulkJobs: async () => {
    const res = await api.get<BulkDiscoveryJob[]>("/discovery/bulk");
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
    const res = await api.get<PaginatedBusinesses>(`/discovery/businesses?${params}`);
    return res.data;
  },

  promoteBusiness: async (id: string) => {
    const res = await api.post(`/discovery/businesses/${id}/promote`);
    return res.data;
  },

  promoteAllValid: async () => {
    const res = await api.post<{ message: string; promoted_count: number }>(`/discovery/businesses/promote-all-valid`);
    return res.data;
  },

  promoteCleanBatch: async (params?: { min_completeness?: number; require_phone?: boolean; require_website?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.min_completeness) query.set('min_completeness', String(params.min_completeness));
    if (params?.require_phone !== undefined) query.set('require_phone', String(params.require_phone));
    if (params?.require_website !== undefined) query.set('require_website', String(params.require_website));
    const res = await api.post<{ message: string; promoted_count: number }>(`/discovery/businesses/promote-clean-batch?${query.toString()}`);
    return res.data;
  },

  markDuplicate: async (id: string) => {
    const res = await api.delete(`/discovery/businesses/${id}/duplicate`);
    return res.data;
  },

  // Metrics
  getMetrics: async (days = 30) => {
    const res = await api.get<DiscoveryMetrics>(`/discovery/metrics?days=${days}`);
    return res.data;
  },

  // Reference data
  getCatalog: async () => {
    const res = await api.get<DiscoveryCatalog>("/discovery/catalog");
    return res.data;
  },
};

