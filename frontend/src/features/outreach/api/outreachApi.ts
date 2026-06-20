import api from '@/lib/api';

export interface OutreachDraftResponse {
  id: string;
  lead_id: string;
  qualification_id: string | null;
  channel: 'EMAIL' | 'LINKEDIN' | 'WHATSAPP' | 'CALL';
  status: 'DRAFT' | 'APPROVED' | 'REJECTED' | 'USED';
  subject: string | null;
  message: string;
  talking_points: string[];
  model_used: string | null;
  tokens_used: number;
  created_at: string;
  updated_at: string;
}

export interface OutreachDraftUpdate {
  subject?: string;
  message?: string;
  talking_points?: string[];
  status?: 'DRAFT' | 'APPROVED' | 'REJECTED' | 'USED';
}

export const outreachApi = {
  getDrafts: async (leadId?: string): Promise<OutreachDraftResponse[]> => {
    const { data } = await api.get('/api/v1/outreach', { params: { lead_id: leadId } });
    return data;
  },

  getDraftById: async (draftId: string): Promise<OutreachDraftResponse> => {
    const { data } = await api.get(`/api/v1/outreach/${draftId}`);
    return data;
  },

  generateDraft: async (
    leadId: string, 
    channel: 'EMAIL' | 'LINKEDIN' | 'WHATSAPP' | 'CALL'
  ): Promise<{ message: string, job_id?: string }> => {
    const { data } = await api.post('/api/v1/outreach/generate', {
      lead_id: leadId,
      channel: channel
    });
    return data;
  },

  updateDraft: async (
    draftId: string, 
    updateData: { status?: 'DRAFT' | 'APPROVED' | 'REJECTED' | 'USED', message?: string, subject?: string }
  ): Promise<OutreachDraftResponse> => {
    const { data } = await api.patch(`/api/v1/outreach/${draftId}`, updateData);
    return data;
  }
};
