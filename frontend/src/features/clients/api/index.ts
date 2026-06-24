import api from '@/lib/api';
import { Client, Project, Task, ClientStats } from '../types';

export const clientsApi = {
  // Clients
  getClients: async () => {
    const { data } = await api.get<Client[]>('/clients');
    return data;
  },
  getClient: async (id: string) => {
    const { data } = await api.get<Client>(`/clients/${id}`);
    return data;
  },
  createClient: async (payload: Partial<Client>) => {
    const { data } = await api.post<Client>('/clients', payload);
    return data;
  },
  updateClient: async (id: string, payload: Partial<Client>) => {
    const { data } = await api.patch<Client>(`/clients/${id}`, payload);
    return data;
  },
  deleteClient: async (id: string) => {
    await api.delete(`/clients/${id}`);
  },
  getStats: async () => {
    const { data } = await api.get<ClientStats>('/clients/stats');
    return data;
  },

  // Projects
  getProjects: async (clientId: string) => {
    const { data } = await api.get<Project[]>(`/clients/${clientId}/projects`);
    return data;
  },
  createProject: async (clientId: string, payload: Partial<Project>) => {
    const { data } = await api.post<Project>(`/clients/${clientId}/projects`, payload);
    return data;
  },
  updateProject: async (id: string, payload: Partial<Project>) => {
    const { data } = await api.patch<Project>(`/projects/${id}`, payload);
    return data;
  },
  deleteProject: async (id: string) => {
    await api.delete(`/projects/${id}`);
  },

  // Tasks
  getTasks: async (projectId: string) => {
    const { data } = await api.get<Task[]>(`/projects/${projectId}/tasks`);
    return data;
  },
  createTask: async (projectId: string, payload: Partial<Task>) => {
    const { data } = await api.post<Task>(`/projects/${projectId}/tasks`, payload);
    return data;
  },
  updateTask: async (id: string, payload: Partial<Task>) => {
    const { data } = await api.patch<Task>(`/tasks/${id}`, payload);
    return data;
  },
  deleteTask: async (id: string) => {
    await api.delete(`/tasks/${id}`);
  },
};
