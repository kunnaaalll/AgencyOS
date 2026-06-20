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
  google_maps_url: string | null;
  raw_payload: Record<string, any>;
  validation_status: string;
  created_at: string;
}

export const discoveryApi = {
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
  
  getBusinesses: async () => {
    const res = await api.get<RawBusiness[]>("/v1/discovery/businesses");
    return res.data;
  },
  
  promoteBusiness: async (id: string) => {
    const res = await api.post(`/v1/discovery/businesses/${id}/promote`);
    return res.data;
  }
};
