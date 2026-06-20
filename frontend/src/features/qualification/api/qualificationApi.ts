import api from '@/lib/api';

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
    const { data } = await api.get('/api/v1/qualification');
    return data;
  },

  getQualificationByLeadId: async (leadId: string): Promise<QualificationResponse> => {
    const { data } = await api.get(`/api/v1/qualification/lead/${leadId}`);
    return data;
  },

  generateQualification: async (leadId: string): Promise<{ message: string, job_id?: string }> => {
    const { data } = await api.post('/api/v1/qualification/generate', { lead_id: leadId });
    return data;
  }
};
