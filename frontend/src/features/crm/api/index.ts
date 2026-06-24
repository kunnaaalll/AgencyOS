import api from '@/lib/api';
import { Opportunity, Activity, Meeting, CRMStats } from '../types';

export const crmApi = {
  // Opportunities
  getOpportunities: async () => {
    const { data } = await api.get<any>('/crm/opportunities');
    return (Array.isArray(data) ? data : data.items || []) as Opportunity[];
  },
  getOpportunity: async (id: string) => {
    const { data } = await api.get<Opportunity>(`/crm/opportunities/${id}`);
    return data;
  },
  createOpportunity: async (payload: Partial<Opportunity>) => {
    const { data } = await api.post<Opportunity>('/crm/opportunities', payload);
    return data;
  },
  updateOpportunity: async (id: string, payload: Partial<Opportunity>) => {
    const { data } = await api.patch<Opportunity>(`/crm/opportunities/${id}`, payload);
    return data;
  },
  deleteOpportunity: async (id: string) => {
    await api.delete(`/crm/opportunities/${id}`);
  },
  getStats: async () => {
    const { data } = await api.get<CRMStats>('/crm/opportunities/stats');
    return data;
  },

  // Activities
  getActivities: async (opportunityId: string) => {
    const { data } = await api.get<Activity[]>(`/crm/opportunities/${opportunityId}/activities`);
    return data;
  },
  createActivity: async (opportunityId: string, payload: Partial<Activity>) => {
    const { data } = await api.post<Activity>(`/crm/opportunities/${opportunityId}/activities`, payload);
    return data;
  },
  updateActivity: async (id: string, payload: Partial<Activity>) => {
    const { data } = await api.patch<Activity>(`/crm/activities/${id}`, payload);
    return data;
  },
  deleteActivity: async (id: string) => {
    await api.delete(`/crm/activities/${id}`);
  },

  // Meetings
  getMeetings: async (opportunityId: string) => {
    const { data } = await api.get<Meeting[]>(`/crm/opportunities/${opportunityId}/meetings`);
    return data;
  },
  createMeeting: async (opportunityId: string, payload: Partial<Meeting>) => {
    const { data } = await api.post<Meeting>(`/crm/opportunities/${opportunityId}/meetings`, payload);
    return data;
  },
  updateMeeting: async (id: string, payload: Partial<Meeting>) => {
    const { data } = await api.patch<Meeting>(`/crm/meetings/${id}`, payload);
    return data;
  },
  deleteMeeting: async (id: string) => {
    await api.delete(`/crm/meetings/${id}`);
  },
};
