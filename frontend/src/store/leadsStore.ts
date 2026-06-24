import { Store } from '@tanstack/react-store'
import { addOpportunity } from './crmStore'
import { PipelineStage } from '@/features/crm/types'

export interface Lead {
  id: string
  name: string
  company: string
  intentScore: number
  status: 'staged' | 'hot' | 'transferred'
  dateAdded: string
  industry?: string
  source?: string
  email?: string
  analysis?: {
    problems: string[]
    seoScore: number
    notes: string
  }
}

interface LeadsState {
  leads: Lead[]
}

const mockLeads: Lead[] = [
  { 
    id: '1', name: 'John Smith', company: 'Acme Corp', intentScore: 95, status: 'hot', dateAdded: '2026-06-23', industry: 'SaaS', source: 'LinkedIn', email: 'john@acme.com',
    analysis: {
      problems: ['No clear Call to Action above fold', 'Page load speed > 4s', 'Missing H1 tags on service pages'],
      seoScore: 45,
      notes: 'Competitors are heavily out-ranking them for "enterprise saas solutions". Prime target for SEO overhaul.'
    }
  },
  { 
    id: '2', name: 'Sarah Connor', company: 'TechFlow', intentScore: 88, status: 'hot', dateAdded: '2026-06-22', industry: 'Cybersecurity', source: 'Apollo', email: 's.connor@techflow.io',
    analysis: {
      problems: ['Mobile responsiveness is broken on pricing page', 'Zero organic blog traffic', 'High bounce rate (80%)'],
      seoScore: 62,
      notes: 'They recently raised Series A but their web presence looks like a template. Needs modern redesign.'
    }
  },
  { 
    id: '3', name: 'Michael Scott', company: 'Dunder Mifflin', intentScore: 92, status: 'hot', dateAdded: '2026-06-21', industry: 'Paper', source: 'Direct', email: 'mscott@dundermifflin.com',
    analysis: {
      problems: ['E-commerce flow is completely broken on Safari', 'No SSL certificate', 'Zero meta descriptions'],
      seoScore: 21,
      notes: 'Desperately needs digital transformation. E-commerce upgrade could double their revenue.'
    }
  },
]

export const leadsStore = new Store<LeadsState>({
  leads: mockLeads,
})

export function transferLead(id: string) {
  const lead = leadsStore.state.leads.find(l => l.id === id)
  if (lead && lead.status !== 'transferred') {
    // Auto create CRM Opportunity
    addOpportunity({
      id: `opp-${lead.id}`,
      lead_id: lead.id,
      title: lead.company,
      pipeline_stage: PipelineStage.NEW,
      value: Math.floor(Math.random() * 5000) + 1000,
      probability: lead.intentScore,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }

  leadsStore.setState((state) => ({
    leads: state.leads.map(lead => lead.id === id ? { ...lead, status: 'transferred' } : lead)
  }))
}

export function publishLeads() {
  leadsStore.setState((state) => ({
    leads: state.leads.map(lead => lead.status === 'staged' ? { ...lead, status: 'hot' } : lead)
  }))
}

export function runAutomation() {
  const newLeads: Lead[] = [
    { 
      id: `mock-${Date.now()}-1`, name: 'Alice Walker', company: 'StartUp Inc', intentScore: 85, status: 'staged', dateAdded: new Date().toISOString().split('T')[0], industry: 'AI', source: 'Web Scrape', email: 'alice@startup.ai',
      analysis: {
        problems: ['Competitor keywords are dominating', 'No blog/content strategy'],
        seoScore: 55,
        notes: 'Great product, terrible distribution.'
      }
    },
    { 
      id: `mock-${Date.now()}-2`, name: 'Bob Builder', company: 'Construct AI', intentScore: 99, status: 'staged', dateAdded: new Date().toISOString().split('T')[0], industry: 'Construction Tech', source: 'LinkedIn', email: 'bob@construct.ai',
      analysis: {
        problems: ['Site looks like it was built in 2005', 'Zero lead capture forms'],
        seoScore: 30,
        notes: 'High intent. They are actively searching for "web design agencies".'
      }
    },
  ]
  leadsStore.setState((state) => ({
    leads: [...newLeads, ...state.leads]
  }))
}
