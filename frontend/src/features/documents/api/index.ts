import api from '@/lib/api';
import { DocumentRecord, CredentialRecord } from '../types';

export const DocumentsAPI = {
  // Documents
  getDocuments: async (): Promise<DocumentRecord[]> => {
    const { data } = await api.get('/documents');
    return data;
  },
  uploadDocument: async (formData: FormData): Promise<DocumentRecord> => {
    const { data } = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return data;
  },
  deleteDocument: async (id: string): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },
  getDownloadUrl: async (id: string): Promise<string> => {
    const { data } = await api.get(`/documents/${id}/download`);
    return data.url;
  },

  // Credentials
  getCredentials: async (): Promise<CredentialRecord[]> => {
    const { data } = await api.get('/credentials');
    return data;
  },
  createCredential: async (credential: Partial<CredentialRecord>): Promise<CredentialRecord> => {
    const { data } = await api.post('/credentials', credential);
    return data;
  },
  updateCredential: async (id: string, credential: Partial<CredentialRecord>): Promise<CredentialRecord> => {
    const { data } = await api.patch(`/credentials/${id}`, credential);
    return data;
  },
  deleteCredential: async (id: string): Promise<void> => {
    await api.delete(`/credentials/${id}`);
  },
};
