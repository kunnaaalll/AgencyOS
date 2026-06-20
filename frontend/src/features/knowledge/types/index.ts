export type KnowledgeStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface KnowledgeCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  slug: string;
  categoryId?: string;
  content: string;
  tags?: string[];
  status: KnowledgeStatus;
  authorId?: string;
  createdAt: string;
  updatedAt: string;
}
