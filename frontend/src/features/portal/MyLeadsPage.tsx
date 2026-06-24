import React, { useState } from 'react'
import { LeadCard } from '@/components/ui/LeadCard'
import { LeadOutreachPanel } from '@/components/ui/LeadOutreachPanel'
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchLeads } from '@/features/leads/api'

export function MyLeadsPage() {
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => fetchLeads(true)
  })
  
  // For the MVP, we assume any lead that is not NEW has been claimed/interacted with
  const myLeads = leads.filter(l => l.status !== 'NEW')
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)

  const selectedLead = myLeads.find(l => l.id === selectedLeadId) || null

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Leads</h1>
          <p className="text-gray-500 mt-2">Leads you have claimed from the hot leads market.</p>
        </div>
        
        {isLoading ? (
          <div className="glass-panel rounded-3xl p-12 text-center border border-white/40">
            <p className="text-gray-500">Loading leads...</p>
          </div>
        ) : myLeads.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center border border-white/40">
            <p className="text-gray-500">You haven't claimed any leads yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {myLeads.map((lead, i) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <LeadCard 
                  lead={lead} 
                  onClick={() => setSelectedLeadId(lead.id)}
                  actionButton={
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Claimed
                    </div>
                  }
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {selectedLead && (
        <LeadOutreachPanel 
          lead={selectedLead} 
          isOpen={!!selectedLead} 
          onClose={() => setSelectedLeadId(null)} 
        />
      )}
    </>
  )
}
