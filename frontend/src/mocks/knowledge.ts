import { KnowledgeArticle } from '../features/knowledge/types';

export const mockKnowledgeArticles: KnowledgeArticle[] = [
  {
    id: 'ka-1',
    slug: 'slug-1',
    title: 'Client Onboarding Playbook',
    content: '1. Welcome Email\n2. Setup Slack Connect\n3. Kickoff Call\n...',
    status: 'PUBLISHED',
    authorId: 'admin-1',
    categoryId: 'cat-1',
    tags: ['onboarding', 'client'],
    createdAt: '2024-05-10T10:00:00Z',
    updatedAt: '2024-06-01T10:00:00Z'
  },
  {
    id: 'ka-2',
    slug: 'slug-2',
    title: 'SEO Audit Checklist',
    content: 'Check technical SEO, content, backlink profile...',
    status: 'PUBLISHED',
    authorId: 'admin-1',
    categoryId: 'cat-2',
    tags: ['seo', 'delivery'],
    createdAt: '2024-05-15T12:00:00Z',
    updatedAt: '2024-06-05T14:00:00Z'
  },
  {
    id: 'ka-3',
    slug: 'slug-3',
    title: 'Objection Handling Scripts',
    content: 'When they say "too expensive", reply with...',
    status: 'DRAFT',
    authorId: 'user-2',
    categoryId: 'cat-3',
    tags: ['sales', 'scripts'],
    createdAt: '2024-06-20T09:00:00Z',
    updatedAt: '2024-06-22T11:00:00Z'
  }
];
