import { api } from '@/lib/api';
import { Opportunity, Activity, Meeting, CRMStats } from '../types';

export const crmApi = {
  // Opportunities
  getOpportunities: async () => {
    const { data } = await api.get<Opportunity[]>('/api/v1/crm/opportunities');
    return data;
  },
  getOpportunity: async (id: string) => {
    const { data } = await api.get<Opportunity>(`/api/v1/crm/opportunities/${id}`);
    return data;
  },
  createOpportunity: async (payload: Partial<Opportunity>) => {
    const { data } = await api.post<Opportunity>('/api/v1/crm/opportunities', payload);
    return data;
  },
  updateOpportunity: async (id: string, payload: Partial<Opportunity>) => {
    const { data } = await api.patch<Opportunity>(`/api/v1/crm/opportunities/${id}`, payload);
    return data;
  },
  deleteOpportunity: async (id: string) => {
    await api.delete(`/api/v1/crm/opportunities/${id}`);
  },
  getStats: async () => {
    const { data } = await api.get<CRMStats>('/api/v1/crm/opportunities/stats');
    return data;
  },

  // Activities
  getActivities: async (opportunityId: string) => {
    const { data } = await api.get<Activity[]>(`/api/v1/crm/opportunities/${opportunityId}/activities`);
    return data;
  },
  createActivity: async (opportunityId: string, payload: Partial<Activity>) => {
    const { data } = await api.post<Activity>(`/api/v1/crm/opportunities/${opportunityId}/activities`, payload);
    return data;
  },
  updateActivity: async (id: string, payload: Partial<Activity>) => {
    const { data } = await api.patch<Activity>(`/api/v1/crm/activities/${id}`, payload);
    return data;
  },
  deleteActivity: async (id: string) => {
    await api.delete(`/api/v1/crm/activities/${id}`);
  },

  // Meetings
  getMeetings: async (opportunityId: string) => {
    const { data } = await api.get<Meeting[]>(`/api/v1/crm/opportunities/${opportunityId}/meetings`);
    return data;
  },
  createMeeting: async (opportunityId: string, payload: Partial<Meeting>) => {
    const { data } = await api.post<Meeting>(`/api/v1/crm/opportunities/${opportunityId}/meetings`, payload);
    return data;
  },
  updateMeeting: async (id: string, payload: Partial<Meeting>) => {
    const { data } = await api.patch<Meeting>(`/api/v1/crm/meetings/${id}`, payload);
    return data;
  },
  deleteMeeting: async (id: string) => {
    await api.delete(`/api/v1/crm/meetings/${id}`);
  },
};
