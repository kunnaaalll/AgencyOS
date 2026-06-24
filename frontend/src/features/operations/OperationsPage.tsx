import { useStore } from '@tanstack/react-store'
import { leadsStore, publishLeads, runAutomation } from '@/store/leadsStore'
import { Zap, ArrowRight, UserPlus, Send, Settings, Sparkles, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/DataTable'
import { LeadCard } from '@/components/ui/LeadCard'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useRef } from 'react'

export function OperationsPage() {
  const { leads } = useStore(leadsStore)
  const containerRef = useRef<HTMLDivElement>(null)

  const stagedLeads = leads.filter(l => l.status === 'staged')
  const publishedLeads = leads.filter(l => l.status === 'hot')

  useGSAP(() => {
    gsap.fromTo('.gsap-fade-up', 
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
    )
  }, { scope: containerRef })

  const columns = [
    { accessorKey: 'name', header: 'Contact Name' },
    { accessorKey: 'company', header: 'Company' },
    { accessorKey: 'intentScore', header: 'Intent Score' },
    { accessorKey: 'dateAdded', header: 'Date Added' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (info: any) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          {info.getValue()}
        </span>
      ),
    },
  ]

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto space-y-8">
      <header className="gsap-fade-up">
        <h1 className="text-claude-display-lg font-medium text-[var(--color-ink)] mb-2">Automation Operations</h1>
        <p className="text-claude-body-md text-[var(--color-muted)]">
          Control center for running backend automations and publishing lead data to co-founders.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 gsap-fade-up">
        {/* Run Discovery Automation */}
        <div className="glass-panel rounded-2xl p-6 border border-white/40 shadow-sm relative overflow-hidden group flex flex-col items-start hover:bg-white/40 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center mb-5 border border-blue-100 shadow-inner">
            <Zap className="w-6 h-6 text-blue-500" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Lead Discovery Loop</h3>
          <p className="text-sm text-gray-500 mb-6 flex-1">
            Execute the scraping protocol to find new highly-qualified prospects and stage them for review.
          </p>
          <Button 
            variant="outline" 
            className="w-full bg-white/60 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm"
            onClick={runAutomation}
          >
            Run Automation Loop
          </Button>
        </div>

        {/* Sync Data */}
        <div className="glass-panel rounded-2xl p-6 border border-white/40 shadow-sm relative overflow-hidden group flex flex-col items-start hover:bg-white/40 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-pink-50 flex items-center justify-center mb-5 border border-pink-100 shadow-inner">
            <UserPlus className="w-6 h-6 text-pink-500" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">CRM Sync</h3>
          <p className="text-sm text-gray-500 mb-6 flex-1">
            Synchronize external CRM systems with AgencyOS leads database.
          </p>
          <Button variant="outline" className="w-full bg-white/60 border-gray-200 hover:bg-white text-gray-600 transition-all shadow-sm">
            Force Sync
          </Button>
        </div>

        {/* Global Settings */}
        <div className="glass-panel rounded-2xl p-6 border border-white/40 shadow-sm relative overflow-hidden group flex flex-col items-start hover:bg-white/40 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-5 border border-gray-100 shadow-inner">
            <Settings className="w-6 h-6 text-gray-500" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Automation Settings</h3>
          <p className="text-sm text-gray-500 mb-6 flex-1">
            Configure prompt parameters, proxies, and intent scoring weightings.
          </p>
          <Button variant="outline" className="w-full bg-white/60 border-gray-200 hover:bg-white text-gray-600 transition-all shadow-sm">
            Configure
          </Button>
        </div>
      </div>

      {/* Staged Leads Section */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-white/40 shadow-sm gsap-fade-up">
        <div className="p-6 border-b border-white/30 flex justify-between items-center bg-white/20">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Staged Leads Ready for Publishing
            </h2>
            <p className="text-sm text-[var(--color-muted)]">
              These leads were recently discovered. Co-founders cannot see them yet.
            </p>
          </div>
          
          <Button 
            variant="primary" 
            onClick={publishLeads}
            disabled={stagedLeads.length === 0}
            className="flex items-center gap-2 shadow-sm"
          >
            <Send className="w-4 h-4" />
            Publish {stagedLeads.length} Leads to Co-Founders
          </Button>
        </div>

        <div className="p-6">
          {stagedLeads.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 mb-4">
                <CheckSquare className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-gray-900 font-medium mb-1">No Staged Leads</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                Run the Discovery Automation Loop above to find new leads and bring them into the staging area.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {stagedLeads.map((lead, i) => (
                <div key={lead.id} className="gsap-fade-up">
                  <LeadCard lead={lead} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Overview of Published Leads */}
      <div className="gsap-fade-up pl-2">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">
          Previously Published Pipeline
        </h3>
        <p className="text-sm text-gray-600">
          There are currently <span className="font-semibold text-gray-900">{publishedLeads.length}</span> published leads actively visible on the co-founders' Hot Leads market.
        </p>
      </div>

    </div>
  )
}
