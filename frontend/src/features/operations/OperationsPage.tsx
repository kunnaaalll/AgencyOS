import { useRef, useState } from 'react'
import { Zap, UserPlus, Send, Settings, Sparkles, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LeadCard } from '@/components/ui/LeadCard'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchLeads, publishLead, Lead } from '@/features/leads/api'
import { discoveryApi } from '@/features/discovery/api/discoveryApi'
import { Input } from '@/components/ui/input'

const HARDCODED_LOCATIONS = ["Mumbai", "Navi Mumbai", "Thane"];
const HARDCODED_INDUSTRIES = [
  "dentist", "restaurant", "salon", "spa", "skin clinic", "gym", 
  "interior designer", "architect", "lawyer", "CA", "real estate agent", 
  "school", "coaching class", "hospital", "bakery", "cafe", 
  "hotel", "jeweller", "furniture store", "digital marketing agency"
];
const HARDCODED_SOURCES = [
  "google_maps", "google_search", "justdial", "indiamart", "clutch", "reddit", "crawl4ai_web"
];

export function OperationsPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  
  const [isRunning, setIsRunning] = useState(false)
  const [limit, setLimit] = useState(10)

  // Fetch staged leads (Leads not yet published, but scored >= 60)
  const { data: stagedLeads = [], isLoading: isLoadingDiscovery } = useQuery({
    queryKey: ['leads', 'unpublished', 'premium'],
    queryFn: () => fetchLeads(false, 60)
  })
  
  // Fetch published leads
  const { data: publishedLeads = [] } = useQuery({
    queryKey: ['leads', 'published'],
    queryFn: () => fetchLeads(true)
  })

  // Mutations
  const publishMutation = useMutation({
    mutationFn: (id: string) => publishLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    }
  })

  const discoveryMutation = useMutation({
    mutationFn: () => discoveryApi.bulkDiscover({
      industries: HARDCODED_INDUSTRIES,
      locations: HARDCODED_LOCATIONS,
      sources: HARDCODED_SOURCES,
      limit_per_query: limit
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discovery-businesses'] })
      queryClient.invalidateQueries({ queryKey: ['discovery-runs'] })
      setIsRunning(false)
      alert("Bulk Automation Loop started successfully in the background!")
    },
    onError: (error: any) => {
      setIsRunning(false)
      alert("Failed to start automation: " + (error?.response?.data?.detail || error.message))
    }
  })

  useGSAP(() => {
    gsap.fromTo('.gsap-fade-up', 
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
    )
  }, { scope: containerRef })

  const handleRunAutomation = () => {
    setIsRunning(true)
    discoveryMutation.mutate()
  }

  const handlePublishAll = () => {
    stagedLeads.forEach(business => {
      publishMutation.mutate(business.id)
    })
  }

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
          <p className="text-sm text-gray-500 mb-4 flex-1">
            Execute the scraping protocol across {HARDCODED_INDUSTRIES.length} industries, {HARDCODED_LOCATIONS.length} locations, and {HARDCODED_SOURCES.length} sources.
          </p>
          <div className="w-full mb-4">
            <label className="block text-xs font-semibold text-gray-700 tracking-wide uppercase mb-1">Limit per combination</label>
            <Input 
              type="number" 
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              min="1"
              max="100"
              className="bg-white/50 border-white/60"
            />
          </div>
          <Button 
            variant="outline" 
            className="w-full bg-white/60 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm"
            onClick={handleRunAutomation}
            disabled={isRunning}
          >
            {isRunning ? 'Starting...' : 'Run Full Automation Loop'}
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
            onClick={handlePublishAll}
            disabled={stagedLeads.length === 0 || publishMutation.isPending}
            className="flex items-center gap-2 shadow-sm"
          >
            <Send className="w-4 h-4" />
            {publishMutation.isPending ? 'Publishing...' : `Publish ${stagedLeads.length} Leads to Co-Founders`}
          </Button>
        </div>

        <div className="p-6">
          {isLoadingDiscovery ? (
            <div className="text-center py-12 text-gray-500">Loading staged leads...</div>
          ) : stagedLeads.length === 0 ? (
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
              {stagedLeads.map((business, i) => (
                <div key={business.id} className="gsap-fade-up">
                  <LeadCard lead={business} actionButton={
                    <Button variant="outline" size="sm" onClick={() => publishMutation.mutate(business.id)}>
                      Publish
                    </Button>
                  } />
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
