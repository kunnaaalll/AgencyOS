import { OutreachDraftResponse } from '../features/outreach/api/outreachApi';

export const mockOutreachDrafts: OutreachDraftResponse[] = [
  {
    id: 'outreach-1',
    lead_id: 'lead-1',
    qualification_id: 'qual-1',
    channel: 'EMAIL',
    status: 'DRAFT',
    subject: 'Boost your online presence',
    message: 'Hi John,\n\nI noticed Acme Corp has been growing...',
    talking_points: ['SEO optimization', 'Recent funding'],
    model_used: 'GPT-4',
    tokens_used: 150,
    created_at: '2024-06-20T10:00:00Z',
    updated_at: '2024-06-20T10:00:00Z',
    business_name: 'Acme Corp'
  },
  {
    id: 'outreach-2',
    lead_id: 'lead-2',
    qualification_id: 'qual-2',
    channel: 'LINKEDIN',
    status: 'APPROVED',
    subject: null,
    message: 'Hey Sarah, loved your recent post on cybersecurity...',
    talking_points: ['Post on cybersecurity', 'Mutual connection'],
    model_used: 'Claude 3 Opus',
    tokens_used: 85,
    created_at: '2024-06-22T14:30:00Z',
    updated_at: '2024-06-22T15:00:00Z',
    business_name: 'TechFlow Inc'
  },
  {
    id: 'outreach-3',
    lead_id: 'lead-3',
    qualification_id: null,
    channel: 'WHATSAPP',
    status: 'USED',
    subject: null,
    message: 'Hi Michael, this is regarding the paper supply inquiry.',
    talking_points: ['Inquiry followup'],
    model_used: null,
    tokens_used: 0,
    created_at: '2024-06-18T09:15:00Z',
    updated_at: '2024-06-19T10:20:00Z',
    business_name: 'Dunder Mifflin'
  }
];