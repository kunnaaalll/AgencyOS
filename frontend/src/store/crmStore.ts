import { Store } from '@tanstack/react-store'
import { Opportunity, PipelineStage } from '@/features/crm/types'
import { mockOpportunities } from '@/mocks'

interface CRMState {
  opportunities: Opportunity[]
}

export const crmStore = new Store<CRMState>({
  opportunities: mockOpportunities as unknown as Opportunity[],
})

export function addOpportunity(opp: Opportunity) {
  crmStore.setState((state) => ({
    opportunities: [opp, ...state.opportunities]
  }))
}

export function updateOpportunityStageLocal(id: string, stage: PipelineStage) {
  crmStore.setState((state) => ({
    opportunities: state.opportunities.map(o => 
      o.id === id ? { ...o, pipeline_stage: stage } : o
    )
  }))
}
