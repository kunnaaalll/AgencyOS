import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from '@tanstack/react-router'
import {
  fetchLeadById,
  fetchLeadAnalysisById,
  fetchAnalysisStatus,
  triggerWebsiteAnalysis,
  updateLead,
  autoDiscoverWebsite,
  LeadAnalysis,
} from '../api'
import { qualificationApi } from '@/features/qualification/api/qualificationApi'
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BarChart3,
  Search,
  MousePointerClick,
  Activity,
  Globe,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Smartphone,
  Share2,
  Send,
  Save,
  MessageSquare,
  Copy,
  Check,
  Flame,
  ChevronDown,
  Zap,
} from 'lucide-react'

export function LeadAnalysisPage() {
  const { id } = useParams({ strict: false }) as { id: string }
  const queryClient = useQueryClient()
  const [websiteInput, setWebsiteInput] = useState('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isManualInputOpen, setIsManualInputOpen] = useState(false)
  const [copiedPitch, setCopiedPitch] = useState(false)
  const [isLocallyAuditing, setIsLocallyAuditing] = useState(false)

  const { data: lead, isLoading: isLeadLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => fetchLeadById(id),
    enabled: !!id,
  })

  // Poll analysis status to detect active background Playwright jobs
  const { data: analysisStatus } = useQuery({
    queryKey: ['leadAnalysisStatus', id],
    queryFn: () => fetchAnalysisStatus(id),
    enabled: !!id,
    refetchInterval: (query) => {
      return isLocallyAuditing || query.state.data?.is_running ? 2000 : false
    },
  })

  const isAuditRunning = isLocallyAuditing || Boolean(analysisStatus?.is_running)

  const {
    data: analysisData,
    isLoading: isAnalysisLoading,
    refetch: refetchAnalysis,
  } = useQuery({
    queryKey: ['leadAnalysis', id],
    queryFn: () => fetchLeadAnalysisById(id),
    enabled: !!id,
    retry: false,
    refetchInterval: isAuditRunning ? 2500 : false,
  })

  const {
    data: qualification,
    isLoading: isQualLoading,
    refetch: refetchQual,
  } = useQuery({
    queryKey: ['leadQualification', id],
    queryFn: () => qualificationApi.getQualificationByLeadId(id),
    enabled: !!id,
    retry: false,
  })

  // Normalize analysis: if array was returned by any fallback or if object has no id, treat as null
  const analysis: LeadAnalysis | null =
    analysisData && !Array.isArray(analysisData) && analysisData.id ? analysisData : null

  // If analysis is now completed and present, clear local auditing flag
  if (analysis && isLocallyAuditing) {
    setIsLocallyAuditing(false)
  }

  // Mutation to run website crawler with instant lock against spamming
  const runMutation = useMutation({
    mutationFn: () => triggerWebsiteAnalysis(id),
    onMutate: () => {
      setIsLocallyAuditing(true)
    },
    onSuccess: (data) => {
      setIsLocallyAuditing(true)
      setStatusMessage('Playwright browser crawler started! Actively inspecting mobile responsiveness, SEO, and page speed...')
      queryClient.invalidateQueries({ queryKey: ['leadAnalysisStatus', id] })
    },
    onError: (err: any) => {
      setIsLocallyAuditing(false)
      const msg = err?.response?.data?.detail || 'Failed to trigger website audit'
      setStatusMessage(`Error: ${msg}`)
    },
  })

  // Mutation to regenerate AI qualification with LLM
  const regenerateQualMutation = useMutation({
    mutationFn: () => qualificationApi.generateQualification(id),
    onSuccess: (newQual) => {
      setStatusMessage('⚡ Bespoke AI intelligence and outreach pitch synthesized via OpenRouter LLM!')
      queryClient.setQueryData(['leadQualification', id], newQual)
      queryClient.invalidateQueries({ queryKey: ['leadQualification', id] })
      queryClient.invalidateQueries({ queryKey: ['lead', id] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'Failed to regenerate AI qualification'
      setStatusMessage(`Error: ${msg}`)
    },
  })

  // Mutation to update website and then trigger analysis
  const updateAndRunMutation = useMutation({
    mutationFn: async (urlToSave: string) => {
      setIsLocallyAuditing(true)
      await updateLead(id, { website: urlToSave })
      return triggerWebsiteAnalysis(id)
    },
    onSuccess: () => {
      setIsLocallyAuditing(true)
      setStatusMessage('Website linked and automated Playwright audit queued!')
      queryClient.invalidateQueries({ queryKey: ['lead', id] })
      queryClient.invalidateQueries({ queryKey: ['leadAnalysisStatus', id] })
    },
    onError: (err: any) => {
      setIsLocallyAuditing(false)
      const msg = err?.response?.data?.detail || 'Failed to update website'
      setStatusMessage(`Error: ${msg}`)
    },
  })

  // Mutation to auto-discover website via web search
  const autoDiscoverMutation = useMutation({
    mutationFn: () => autoDiscoverWebsite(id),
    onSuccess: (data) => {
      setStatusMessage(data.message)
      if (data.success && data.website) {
        queryClient.invalidateQueries({ queryKey: ['lead', id] })
        queryClient.invalidateQueries({ queryKey: ['leads'] })
        queryClient.invalidateQueries({ queryKey: ['leadAnalysisStatus', id] })
        setTimeout(() => {
          refetchAnalysis()
          queryClient.invalidateQueries({ queryKey: ['leadAnalysis', id] })
        }, 3000)
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'Auto-discovery encountered an error'
      setStatusMessage(`Error: ${msg}`)
    },
  })

  if (isLeadLoading || isAnalysisLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-500 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium">Loading genuine lead intelligence...</p>
      </div>
    )
  }

  const effectiveWebsite = lead?.website || analysis?.website_url

  // Industry-specific revenue leak calculation
  const getRevenueLeakInfo = (industry?: string | null, city?: string | null) => {
    const ind = (industry || '').toLowerCase()
    if (ind.includes('gym') || ind.includes('fitness') || ind.includes('crossfit') || ind.includes('workout')) {
      return {
        amount: '₹1,40,000 / month',
        desc: 'Lost high-ticket fitness memberships & personal training signups to commercial gyms with online trial portals.',
      }
    }
    if (ind.includes('dent') || ind.includes('oral') || ind.includes('ortho')) {
      return {
        amount: '₹3,20,000 / month',
        desc: 'High-margin dental implant & cosmetic smile makeover patients booking with digital-first clinics nearby.',
      }
    }
    if (ind.includes('skin') || ind.includes('derma') || ind.includes('hair') || ind.includes('aesthetic') || ind.includes('laser') || ind.includes('salon') || ind.includes('spa')) {
      return {
        amount: '₹2,80,000 / month',
        desc: 'High-ticket HydraFacial, PRP, and laser procedure clients booking online with competing aesthetic clinics.',
      }
    }
    if (ind.includes('production') || ind.includes('ott') || ind.includes('media') || ind.includes('film') || ind.includes('studio') || ind.includes('creative')) {
      return {
        amount: '₹6,00,000 / month',
        desc: 'Commercial brand retainers & video production contracts lost to digital-first agencies with searchable case studies.',
      }
    }
    return {
      amount: '₹2,10,000 / month',
      desc: `High-intent local ${industry || 'service'} clients searching in ${city || 'the area'} who convert with competitors.`,
    }
  }

  const revenueLeak = getRevenueLeakInfo(lead?.industry, lead?.city)

  // WhatsApp outreach helpers
  const cleanPhone = lead?.phone ? lead.phone.replace(/[^\d+]/g, '') : ''
  const waNum = cleanPhone.startsWith('+')
    ? cleanPhone.slice(1)
    : cleanPhone.length === 10
    ? `91${cleanPhone}`
    : cleanPhone

  const pitchScript =
    qualification?.recommended_pitch ||
    `Hi ${lead?.business_name || 'Business'} team, noticed your strong local presence in ${lead?.city || 'the area'}, but noticed you don't have a modern mobile booking website online. Customers searching Google for ${lead?.industry || 'services'} are choosing competitors with direct WhatsApp booking. Can I share a quick 60-second video preview?`

  const waLink = waNum ? `https://wa.me/${waNum}?text=${encodeURIComponent(pitchScript)}` : ''

  // If no analysis exists yet, render intuitive empty state with direct action
  if (!analysis) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/leads/$id"
              params={{ id }}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </Link>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <img src="/stand-transparent.png" alt="AgencyOS" className="w-4 h-4 object-contain" />
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-mono">AgencyOS Intelligence Teardown</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Lead Intelligence: {lead?.business_name || 'Business'}
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5 flex items-center flex-wrap gap-2">
                {lead?.industry ? `${lead.industry} • ` : ''}
                {lead?.city ? `${lead.city} • ` : ''}
                {isAuditRunning ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Crawl in Progress: Automated Playwright Browser Active
                  </span>
                ) : (
                  <span>
                    Website Audit: <span className="font-semibold text-amber-600">Pending Crawl</span>
                  </span>
                )}
                {qualification?.model_used && (
                  <span className="font-mono text-[10px] text-zinc-400">
                    (AI: {qualification.model_used.split('/').pop()})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => regenerateQualMutation.mutate()}
              disabled={regenerateQualMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Trigger live LLM re-evaluation"
            >
              <Zap className={`w-3.5 h-3.5 ${regenerateQualMutation.isPending ? 'animate-spin' : 'text-amber-300'}`} />
              {regenerateQualMutation.isPending ? 'Synthesizing with LLM...' : '⚡ Re-Generate AI Intelligence'}
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 text-sm flex items-center justify-between">
            <span>{statusMessage}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-xs font-semibold hover:underline text-indigo-600"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dynamic Intelligence Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 shadow-sm">
          {effectiveWebsite ? (
            isAuditRunning ? (
              /* LIVE IN-PROGRESS AUDIT VIEW (ANTI-SPAM SHIELD) */
              <div className="text-center max-w-xl mx-auto space-y-6 py-4 animate-fade-in">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
                  <div className="relative w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  </div>
                </div>

                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 mb-2">
                    <Activity className="w-3.5 h-3.5 animate-pulse text-amber-500" />
                    Live Crawler Active • In Process
                  </span>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    Deep Playwright Website Crawl in Progress
                  </h2>
                  <p className="text-zinc-600 dark:text-zinc-400 text-xs mt-1.5 max-w-md mx-auto leading-relaxed">
                    Automated browser is navigating to{' '}
                    <span className="font-mono font-medium text-indigo-600 underline">
                      {effectiveWebsite}
                    </span>{' '}
                    to inspect SEO structure, mobile viewport responsiveness, Core Web Vitals, and conversion hooks.
                  </p>
                </div>

                {/* Live Step Tracker */}
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-left space-y-2.5 max-w-md mx-auto">
                  <div className="flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Playwright headless worker dispatched to background</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                    <span>Inspecting DOM tree, mobile viewport & SEO metadata...</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-zinc-400 font-medium">
                    <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-600 flex items-center justify-center text-[10px] shrink-0">
                      •
                    </div>
                    <span>Generating 6-vector score report & syncing with AI intelligence</span>
                  </div>
                </div>

                {/* Anti-spam Disabled Button */}
                <button
                  disabled
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 font-semibold text-sm cursor-not-allowed border border-zinc-200 dark:border-zinc-700 shadow-none select-none"
                >
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                  Website Audit in Process... Please Wait (Auto-Refreshing)
                </button>
              </div>
            ) : (
              /* READY TO AUDIT VIEW */
              <div className="text-center max-w-xl mx-auto space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center mx-auto text-indigo-600">
                  <Sparkles className="w-8 h-8" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    Ready to Run Website Audit
                  </h2>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                    AgencyOS deep-crawls business websites using automated Playwright browsers to inspect SEO meta-tags, mobile responsiveness, conversion call-to-actions, and social authority.
                  </p>
                </div>

                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs flex items-center justify-between">
                  <span className="text-zinc-500">Target Website:</span>
                  <a
                    href={effectiveWebsite.startsWith('http') ? effectiveWebsite : `https://${effectiveWebsite}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono font-medium text-indigo-600 hover:underline flex items-center gap-1.5"
                  >
                    {effectiveWebsite}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <button
                  onClick={() => runMutation.mutate()}
                  disabled={runMutation.isPending || isAuditRunning}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {runMutation.isPending || isAuditRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Dispatching Playwright Crawler...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      Run AI Website Audit Now
                    </>
                  )}
                </button>
              </div>
            )
          ) : (
            <div className="space-y-6 text-left">
              {/* Header Box */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-gradient-to-r from-purple-900/10 via-indigo-900/5 to-slate-900/10 border border-purple-200 dark:border-purple-800/40">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                      Prime Acquisition Prospect
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">Zero Standalone Website on Google Maps</span>
                  </div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Offline Business Intelligence: {lead?.business_name}
                  </h2>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-2xl">
                    {qualification?.summary ||
                      `This business has no standalone website indexed on Google Maps. In B2B agency sales, local businesses without a modern site convert at the highest rate for dedicated acquisition funnels.`}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => autoDiscoverMutation.mutate()}
                    disabled={autoDiscoverMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {autoDiscoverMutation.isPending ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Scanning Web...
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        Auto-Discover Website via Search
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 3 Strategy KPI Cards - DYNAMICALLY SOURCED */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
                  <span className="text-xs text-zinc-500 block mb-1">Opportunity Score</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {qualification?.opportunity_score ?? lead?.score ?? 88}/100
                    </span>
                    <span className="text-[11px] font-medium text-emerald-600">
                      {qualification?.qualification_status === 'QUALIFIED' ? 'High Intent Prospect' : qualification?.qualification_status || 'Qualified'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    {qualification?.priority === 'HIGH'
                      ? 'Direct uncontested pitch for digital infrastructure overhaul.'
                      : 'Solid digital foundations candidate for performance marketing.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
                  <span className="text-xs text-zinc-500 block mb-1">Recommended Retainer Offer</span>
                  <div className="text-sm md:text-base font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2">
                    {qualification?.recommended_package || '₹45k Setup + ₹25k/mo Growth Retainer'}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Industry-tailored retainer for {lead?.industry || 'local business'} growth in {lead?.city || 'India'}.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
                  <span className="text-xs text-zinc-500 block mb-1">Estimated Revenue Leak</span>
                  <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
                    {revenueLeak.amount}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">{revenueLeak.desc}</p>
                </div>
              </div>

              {/* AI-Detected Pain Points */}
              {qualification?.pain_points && qualification.pain_points.length > 0 && (
                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    AI-Identified Commercial & Digital Gaps ({qualification.pain_points.length})
                  </span>
                  <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {qualification.pain_points.map((pt, idx) => (
                      <li
                        key={idx}
                        className="p-3 rounded-lg bg-white dark:bg-zinc-900/80 border border-amber-100 dark:border-amber-900/40 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed flex items-start gap-2 shadow-xs"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ready-to-Send Outreach Playbook - DYNAMIC SCRIPT */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                    AI 1-Click Outreach Pitch Script
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(pitchScript)
                        setCopiedPitch(true)
                        setTimeout(() => setCopiedPitch(false), 2000)
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
                    >
                      {copiedPitch ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-zinc-500" />
                          Copy Script
                        </>
                      )}
                    </button>
                    {waNum && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        Send via WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono text-slate-700 dark:text-slate-300 leading-relaxed select-all">
                  {pitchScript}
                </div>
              </div>

              {/* Optional Collapsible Manual Link */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                <button
                  onClick={() => setIsManualInputOpen(!isManualInputOpen)}
                  className="flex items-center justify-between w-full text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 py-1 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    Already found their standalone website? Link it manually to trigger Playwright crawl
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isManualInputOpen ? 'rotate-180' : ''}`} />
                </button>

                {isManualInputOpen && (
                  <div className="mt-3 flex gap-2">
                    <div className="relative flex-1">
                      <Globe className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                      <input
                        type="url"
                        placeholder="https://example.com"
                        value={websiteInput}
                        onChange={(e) => setWebsiteInput(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!websiteInput.trim()) return
                        let formatted = websiteInput.trim()
                        if (!formatted.startsWith('http')) {
                          formatted = `https://${formatted}`
                        }
                        updateAndRunMutation.mutate(formatted)
                      }}
                      disabled={updateAndRunMutation.isPending || isAuditRunning || !websiteInput.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-xs disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                    >
                      {updateAndRunMutation.isPending || isAuditRunning ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      Save & Audit
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Safe normalized arrays
  const strengths = Array.isArray(analysis.strengths) ? analysis.strengths : []
  const weaknesses = Array.isArray(analysis.weaknesses) ? analysis.weaknesses : []
  const painPoints = Array.isArray(analysis.pain_points) ? analysis.pain_points : []

  const overallScore = analysis.overall_score ?? analysis.total_score ?? 0

  const scoreVectors = [
    {
      label: 'Website Architecture',
      score: analysis.website_score ?? 0,
      icon: Globe,
      max: 20,
      desc: 'SSL security, HTTPS, server response speed',
    },
    {
      label: 'SEO Discoverability',
      score: analysis.seo_score ?? 0,
      icon: Search,
      max: 20,
      desc: 'Meta titles, headings, OpenGraph, search indexing',
    },
    {
      label: 'Mobile Viewport',
      score: analysis.mobile_score ?? 0,
      icon: Smartphone,
      max: 15,
      desc: 'Responsive rendering on mobile devices',
    },
    {
      label: 'CTA & Conversions',
      score: analysis.cta_score ?? 0,
      icon: MousePointerClick,
      max: 15,
      desc: 'Call-to-action buttons, lead forms, booking flows',
    },
    {
      label: 'Social Authority',
      score: analysis.social_score ?? analysis.instagram_score ?? 0,
      icon: Share2,
      max: 15,
      desc: 'Connected social profiles and brand engagement',
    },
    {
      label: 'Digital Maturity',
      score: analysis.digital_maturity_score ?? 0,
      icon: Activity,
      max: 15,
      desc: 'Modern tech stack and conversion readiness',
    },
  ]

  const scoreBadgeColor =
    overallScore >= 70
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
      : overallScore >= 40
      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
      : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/leads/$id"
            params={{ id }}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {lead?.business_name || 'Business'} Audit
              </h1>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${scoreBadgeColor}`}>
                Audit Score: {overallScore}/100
              </span>
              {qualification?.opportunity_score && (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full border bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                  Opportunity: {qualification.opportunity_score}/100
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
              {analysis.website_url && (
                <a
                  href={analysis.website_url.startsWith('http') ? analysis.website_url : `https://${analysis.website_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline text-indigo-600 flex items-center gap-1 font-mono"
                >
                  {analysis.website_url}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {analysis.analyzed_at && (
                <span>• Crawled on {new Date(analysis.analyzed_at).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => regenerateQualMutation.mutate()}
            disabled={regenerateQualMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Re-run bespoke LLM evaluation"
          >
            <Zap className={`w-3.5 h-3.5 ${regenerateQualMutation.isPending ? 'animate-spin' : 'text-amber-300'}`} />
            {regenerateQualMutation.isPending ? 'Synthesizing...' : '⚡ Re-Generate AI'}
          </button>

          <button
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending || isAuditRunning}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${runMutation.isPending || isAuditRunning ? 'animate-spin' : ''}`} />
            {runMutation.isPending || isAuditRunning ? 'Auditing...' : 'Re-run Crawler'}
          </button>

          <Link
            to="/outreach"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Outreach Pipeline
          </Link>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 text-sm flex items-center justify-between">
          <span>{statusMessage}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-semibold hover:underline text-indigo-600 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* AI Strategy Summary Card */}
      {qualification && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
            <span className="text-xs text-zinc-500 block mb-1">Opportunity Score</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {qualification.opportunity_score}/100
              </span>
              <span className="text-[11px] font-medium text-emerald-600">
                {qualification.qualification_status}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">{qualification.summary}</p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
            <span className="text-xs text-zinc-500 block mb-1">Recommended Offer</span>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {qualification.recommended_package || 'Custom Performance Retainer'}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Bespoke pricing based on digital readiness score.</p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
            <span className="text-xs text-zinc-500 block mb-1">Estimated Revenue Leak</span>
            <div className="text-base font-bold text-rose-600 dark:text-rose-400">
              {revenueLeak.amount}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">{revenueLeak.desc}</p>
          </div>
        </div>
      )}

      {/* Ready-to-Send Outreach Script */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
            AI 1-Click Outreach Pitch Script
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(pitchScript)
                setCopiedPitch(true)
                setTimeout(() => setCopiedPitch(false), 2000)
              }}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
            >
              {copiedPitch ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-zinc-500" />
                  Copy Script
                </>
              )}
            </button>
            {waNum && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                <Send className="w-3 h-3" />
                Send via WhatsApp
              </a>
            )}
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs font-mono text-slate-700 dark:text-slate-300 leading-relaxed select-all">
          {pitchScript}
        </div>
      </div>

      {/* 6-Vector Breakdown Grid */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          Technical Audit Vectors
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scoreVectors.map((v, i) => {
            const Icon = v.icon
            const percent = Math.min(100, Math.round(((v.score || 0) / v.max) * 100))
            const barColor =
              percent >= 75
                ? 'bg-emerald-500'
                : percent >= 45
                ? 'bg-amber-500'
                : 'bg-rose-500'

            return (
              <div
                key={i}
                className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      <Icon className="w-4 h-4 text-indigo-500" />
                      {v.label}
                    </span>
                    <span className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100">
                      {v.score}/{v.max}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mb-3">{v.desc}</p>
                </div>

                <div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-end mt-1">
                    <span className="text-[10px] font-semibold text-zinc-400">{percent}%</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3 Pillars: Strengths, Weaknesses, Pain Points */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Strengths */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-emerald-100 dark:border-emerald-950/60 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-400 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Identified Strengths ({strengths.length})
          </h3>
          {strengths.length > 0 ? (
            <ul className="space-y-2.5">
              {strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-400 italic">No positive signals detected during scan.</p>
          )}
        </div>

        {/* Weaknesses */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-rose-100 dark:border-rose-950/60 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-rose-800 dark:text-rose-400 mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-600" />
            Detected Weaknesses ({weaknesses.length})
          </h3>
          {weaknesses.length > 0 ? (
            <ul className="space-y-2.5">
              {weaknesses.map((weak, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <span>{weak}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-400 italic">No structural flaws discovered.</p>
          )}
        </div>

        {/* Pain Points */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-amber-100 dark:border-amber-950/60 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Sales Pitch Opportunities ({painPoints.length})
          </h3>
          {painPoints.length > 0 ? (
            <ul className="space-y-2.5">
              {painPoints.map((pp, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span>{pp}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-400 italic">No immediate client pain points flagged.</p>
          )}
        </div>

        {/* Verified AgencyOS Signature Box */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-xs text-zinc-500 gap-3">
          <div className="flex items-center gap-2">
            <img src="/stand-transparent.png" alt="AgencyOS" className="w-5 h-5 object-contain" />
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Generated & Verified by AgencyOS Engine</span>
            <span>•</span>
            <span>Continuous Market Intelligence</span>
          </div>
          <div className="flex items-center gap-2">
            <img src="/Logo-transparent.png" alt="AgencyOS" className="h-4 w-auto object-contain dark:hidden" />
            <img src="/Logo-dark.png" alt="AgencyOS" className="h-4 w-auto object-contain hidden dark:block" />
          </div>
        </div>
      </div>
    </div>
  )
}
