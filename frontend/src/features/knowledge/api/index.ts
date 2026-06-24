import api from '@/lib/api';
import { KnowledgeArticle, KnowledgeCategory } from '../types';

export const KnowledgeAPI = {
  // Articles
  getArticles: async (): Promise<KnowledgeArticle[]> => {
    const { data } = await api.get('/knowledge/articles');
    return data;
  },
  getArticle: async (id: string): Promise<KnowledgeArticle> => {
    const { data } = await api.get(`/knowledge/articles/${id}`);
    return data;
  },
  createArticle: async (article: Partial<KnowledgeArticle>): Promise<KnowledgeArticle> => {
    const { data } = await api.post('/knowledge/articles', article);
    return data;
  },
  updateArticle: async (id: string, article: Partial<KnowledgeArticle>): Promise<KnowledgeArticle> => {
    const { data } = await api.patch(`/knowledge/articles/${id}`, article);
    return data;
  },
  deleteArticle: async (id: string): Promise<void> => {
    await api.delete(`/knowledge/articles/${id}`);
  },

  // Categories
  getCategories: async (): Promise<KnowledgeCategory[]> => {
    const { data } = await api.get('/knowledge/categories');
    return data;
  },
  createCategory: async (category: Partial<KnowledgeCategory>): Promise<KnowledgeCategory> => {
    const { data } = await api.post('/knowledge/categories', category);
    return data;
  },
};
