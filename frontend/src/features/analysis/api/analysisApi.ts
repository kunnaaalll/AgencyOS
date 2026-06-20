import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// Setup generic axios instance or use existing.
// Assuming the project uses a pre-configured api client.
// Based on typical AgencyOS structure, let's create a generic api call setup or import.
// For now, using direct axios calls with interceptors assuming an `api` instance exists.
import { api } from "@/lib/api";

export interface WebsiteAnalysis {
  id: string;
  lead_id: string;
  website_url: string;
  website_score: number | null;
  seo_score: number | null;
  mobile_score: number | null;
  cta_score: number | null;
  social_score: number | null;
  digital_maturity_score: number | null;
  overall_score: number | null;
  strengths: string[];
  weaknesses: string[];
  pain_points: string[];
  analyzed_at: string | null;
}

export const analysisKeys = {
  all: ["analysis"] as const,
  lists: () => [...analysisKeys.all, "list"] as const,
  detail: (leadId: string) => [...analysisKeys.all, "detail", leadId] as const,
};

export function useAnalysisList() {
  return useQuery({
    queryKey: analysisKeys.lists(),
    queryFn: async (): Promise<WebsiteAnalysis[]> => {
      const response = await api.get("/api/v1/analysis");
      return response.data;
    },
  });
}

export function useAnalysisDetail(leadId: string) {
  return useQuery({
    queryKey: analysisKeys.detail(leadId),
    queryFn: async (): Promise<WebsiteAnalysis> => {
      const response = await api.get(`/api/v1/analysis/${leadId}`);
      return response.data;
    },
    enabled: !!leadId,
  });
}

export function useRunAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      const response = await api.post(`/api/v1/analysis/run/${leadId}`);
      return response.data;
    },
    onSuccess: (_, leadId) => {
      queryClient.invalidateQueries({ queryKey: analysisKeys.detail(leadId) });
      queryClient.invalidateQueries({ queryKey: analysisKeys.lists() });
    },
  });
}
