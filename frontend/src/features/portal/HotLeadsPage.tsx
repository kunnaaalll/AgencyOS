import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchLeads, updateLead, promoteCleanBatch, Lead } from '@/features/leads/api'
import { crmApi } from '@/features/crm/api'
import { PipelineStage } from '@/features/crm/types'
import { LeadCard } from '@/components/ui/LeadCard'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flame,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  IndianRupee,
  PhoneCall,
  Loader2,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Building2,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HotLeadsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [cleanOnly, setCleanOnly] = useState(true)
  const [tierFilter, setTierFilter] = useState<'ALL' | 'ENTERPRISE' | 'GROWTH'>('ALL')
  const [stageFilter, setStageFilter] = useState<string>('ALL')
  const [batchSuccessMsg, setBatchSuccessMsg] = useState<string | null>(null)

  const { data: leads = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['leads'],
    queryFn: () => fetchLeads(true),
  })

  // Status update mutation for tracking
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await updateLead(id, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })

  // Clean Batch Promote mutation
  const batchPromoteMutation = useMutation({
    mutationFn: async () => {
      return await promoteCleanBatch(60)
    },
    onSuccess: (res) => {
      setBatchSuccessMsg(res.message || 'Clean leads promoted!')
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      setTimeout(() => setBatchSuccessMsg(null), 4000)
    },
  })

  // Claim mutation (moves to CRM opportunity)
  const claimMutation = useMutation({
    mutationFn: async (lead: Lead) => {
      await crmApi.createOpportunity({
        lead_id: lead.id,
        title: `${lead.business_name} - Marketing Retainer`,
        pipeline_stage: PipelineStage.NEW,
        value: (lead.score || 0) >= 88 ? 50000 : 25000,
        probability: lead.score || 75,
      })
      await updateLead(lead.id, { status: 'CONTACTED' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
    },
  })

  // Filter leads based on Clean Data, Buying Power Tier, Stage, and Search
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // 1. Clean Data Filter: Must have Phone & Website if cleanOnly is checked
      if (cleanOnly) {
        if (!lead.phone || !lead.website) return false
      }

      // 2. Search Filter
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchesName = lead.business_name?.toLowerCase().includes(q)
        const matchesCity = lead.city?.toLowerCase().includes(q)
        const matchesIndustry = lead.industry?.toLowerCase().includes(q)
        if (!matchesName && !matchesCity && !matchesIndustry) return false
      }

      // 3. Buying Power Tier Filter (High-ticket retainers)
      const isEnterprise =
        (lead.score || 0) >= 88 ||
        (lead.industry &&
          ['cosmetic', 'clinic', 'real estate', 'architect', 'interior', 'implant', 'dermatology'].some((k) =>
            lead.industry?.toLowerCase().includes(k)
          ))
      if (tierFilter === 'ENTERPRISE' && !isEnterprise) return false
      if (tierFilter === 'GROWTH' && isEnterprise) return false

      // 4. Stage Filter
      if (stageFilter !== 'ALL' && lead.status !== stageFilter) return false

      return true
    })
  }, [leads, cleanOnly, search, tierFilter, stageFilter])

  // Aggregate metrics
  const cleanLeadsCount = leads.filter((l) => l.phone && l.website).length
  const totalPipelineMRR = filteredLeads.reduce((acc, lead) => {
    const isEnt = (lead.score || 0) >= 88
    return acc + (isEnt ? 50000 : 25000)
  }, 0)

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-100 text-orange-600">
              <Flame className="w-5 h-5 fill-orange-500" />
            </span>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">High-Ticket Hot Leads Market</h1>
          </div>
          <p className="text-gray-500 mt-1 text-sm">
            Pre-qualified businesses with proven buying power for <strong className="text-gray-800">₹25,000 – ₹1,00,000/mo</strong> retainers. Zero incomplete data allowed.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh Leads
          </Button>

          <Button
            onClick={() => batchPromoteMutation.mutate()}
            disabled={batchPromoteMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 shadow-xs"
          >
            {batchPromoteMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
            )}
            Clean & Promote Batch
          </Button>
        </div>
      </div>

      {/* Batch Success Message */}
      {batchSuccessMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {batchSuccessMsg}
        </motion.div>
      )}

      {/* KPI Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Hot Leads Ready</span>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{filteredLeads.length}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-orange-100/80 text-orange-600">
            <Flame className="w-5 h-5 fill-orange-500" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">100% Clean Verified</span>
            <p className="text-2xl font-bold text-emerald-700 mt-0.5">{cleanLeadsCount}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-100/80 text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Pipeline Retainer Value</span>
            <p className="text-2xl font-bold text-blue-700 mt-0.5">₹{totalPipelineMRR.toLocaleString()}/mo</p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-100/80 text-blue-600">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Min. Retainer Target</span>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">₹25,000/mo</p>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-100/80 text-indigo-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/60 bg-white/80 backdrop-blur-md space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by business name, city (e.g. Bandra), niche..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          {/* Clean Data Switch */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer bg-emerald-50/80 hover:bg-emerald-100/80 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors">
              <input
                type="checkbox"
                checked={cleanOnly}
                onChange={(e) => setCleanOnly(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
              />
              <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Strict Clean Data (Phone + Website Required)
              </span>
            </label>

            {/* Buying Power Tier Toggle */}
            <div className="inline-flex rounded-xl p-1 bg-gray-100 border border-gray-200 text-xs">
              <button
                onClick={() => setTierFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  tierFilter === 'ALL' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                All Tiers
              </button>
              <button
                onClick={() => setTierFilter('ENTERPRISE')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  tierFilter === 'ENTERPRISE' ? 'bg-white text-orange-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                ₹50k-₹1L+ (Enterprise)
              </button>
              <button
                onClick={() => setTierFilter('GROWTH')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  tierFilter === 'GROWTH' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                ₹25k-₹50k (Growth)
              </button>
            </div>

            {/* Stage Filter */}
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="text-xs font-medium bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="ALL">All Pipeline Stages</option>
              <option value="NEW">Stage: Cleaned (NEW)</option>
              <option value="ANALYZED">Stage: Audited</option>
              <option value="CONTACTED">Stage: Contacted</option>
              <option value="MEETING">Stage: Meeting Scheduled</option>
              <option value="PROPOSAL">Stage: Proposal Sent</option>
              <option value="WON">Stage: Retainer Won</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hot Leads Grid */}
      {isLoading ? (
        <div className="glass-panel rounded-3xl p-16 text-center border border-white/60 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)] mb-4" />
          <p className="text-gray-500 font-medium">Scanning and qualifying hot leads with buying power...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="glass-panel rounded-3xl p-16 text-center border border-white/60 bg-white/60">
          <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800">No matching hot leads found</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto mt-1">
            {cleanOnly
              ? 'All unverified or incomplete records were filtered out to protect your team from low-budget leads. Click "Clean & Promote Batch" or uncheck the strict filter.'
              : 'Try adjusting your search criteria or trigger a new discovery cycle from the dashboard.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Button
              onClick={() => batchPromoteMutation.mutate()}
              disabled={batchPromoteMutation.isPending}
              className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
              Promote Clean Batch from Discovery
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredLeads.map((lead, i) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03 }}
              >
                <LeadCard
                  lead={lead}
                  onStatusChange={(leadId, newStatus) =>
                    statusMutation.mutate({ id: leadId, status: newStatus })
                  }
                  actionButton={
                    <Button
                      onClick={() => claimMutation.mutate(lead)}
                      disabled={claimMutation.isPending || lead.status === 'CONTACTED'}
                      variant="outline"
                      className="bg-white/80 border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white shadow-xs transition-all text-xs h-8 px-2.5"
                    >
                      {lead.status === 'CONTACTED' ? (
                        <>Claimed <Check className="w-3 h-3 ml-1" /></>
                      ) : (
                        <>Claim <ArrowRight className="w-3 h-3 ml-1" /></>
                      )}
                    </Button>
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}
