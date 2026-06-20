import { apiClient } from '@/lib/apiClient';

export interface QualificationResponse {
  id: string;
  lead_id: string;
  website_analysis_id: string | null;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  opportunity_score: number;
  qualification_status: 'QUALIFIED' | 'REVIEW_REQUIRED' | 'NOT_QUALIFIED';
  summary: string | null;
  pain_points: string[];
  recommended_pitch: string | null;
  recommended_package: string | null;
  confidence: number;
  model_used: string | null;
  created_at: string;
}

export const qualificationApi = {
  getQualifications: async (): Promise<QualificationResponse[]> => {
    const response = await apiClient.get('/api/v1/qualification');
    return response.data;
  },

  getQualificationByLead: async (leadId: string): Promise<QualificationResponse> => {
    const response = await apiClient.get(`/api/v1/qualification/${leadId}`);
    return response.data;
  },

  runQualification: async (leadId: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/api/v1/qualification/run/${leadId}`);
    return response.data;
  },
};
