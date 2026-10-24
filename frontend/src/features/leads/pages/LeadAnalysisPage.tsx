import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from '@tanstack/react-router'
import { fetchLeadById, fetchLeadAnalysisById, triggerWebsiteAnalysis, updateLead, LeadAnalysis } from '../api'
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
} from 'lucide-react'

export function LeadAnalysisPage() {
  const { id } = useParams({ strict: false }) as { id: string }
  const queryClient = useQueryClient()
  const [websiteInput, setWebsiteInput] = useState('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const { data: lead, isLoading: isLeadLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => fetchLeadById(id),
    enabled: !!id,
  })

  const {
    data: analysisData,
    isLoading: isAnalysisLoading,
    refetch: refetchAnalysis,
  } = useQuery({
    queryKey: ['leadAnalysis', id],
    queryFn: () => fetchLeadAnalysisById(id),
    enabled: !!id,
    retry: false,
  })

  // Normalize analysis: if array was returned by any fallback or if object has no id, treat as null
  const analysis: LeadAnalysis | null =
    analysisData && !Array.isArray(analysisData) && analysisData.id ? analysisData : null

  // Mutation to run analysis
  const runMutation = useMutation({
    mutationFn: () => triggerWebsiteAnalysis(id),
    onSuccess: () => {
      setStatusMessage('Analysis queued successfully! The crawler is actively evaluating the website.')
      setTimeout(() => {
        refetchAnalysis()
        queryClient.invalidateQueries({ queryKey: ['leadAnalysis', id] })
      }, 3000)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'Failed to trigger website audit'
      setStatusMessage(`Error: ${msg}`)
    },
  })

  // Mutation to update website and then trigger analysis
  const updateAndRunMutation = useMutation({
    mutationFn: async (urlToSave: string) => {
      await updateLead(id, { website: urlToSave })
      return triggerWebsiteAnalysis(id)
    },
    onSuccess: () => {
      setStatusMessage('Website updated and audit queued successfully!')
      queryClient.invalidateQueries({ queryKey: ['lead', id] })
      setTimeout(() => {
        refetchAnalysis()
        queryClient.invalidateQueries({ queryKey: ['leadAnalysis', id] })
      }, 3000)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'Failed to update website'
      setStatusMessage(`Error: ${msg}`)
    },
  })

  if (isLeadLoading || isAnalysisLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-500 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium">Loading lead audit & intelligence data...</p>
      </div>
    )
  }

  const effectiveWebsite = lead?.website || analysis?.website_url

  // If no analysis exists yet, render intuitive empty state with direct action
  if (!analysis) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-4">
          <Link
            to="/leads/$id"
            params={{ id }}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Website Audit: {lead?.business_name || 'Business'}
            </h1>
            <p className="text-sm text-zinc-500">
              {lead?.industry ? `${lead.industry} • ` : ''}
              {lead?.city ? `${lead.city} • ` : ''}
              Audit Status: <span className="font-semibold text-amber-600">Pending Execution</span>
            </p>
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

        {/* Empty State Banner */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center mx-auto mb-5 text-indigo-600">
            <Sparkles className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            No Website Audit Generated Yet
          </h2>

          <p className="text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto text-sm leading-relaxed mb-6">
            AgencyOS deep-crawls business websites using automated Playwright browsers to inspect SEO meta-tags,
            mobile responsiveness, conversion call-to-actions, and social authority.
          </p>

          {effectiveWebsite ? (
            <div className="max-w-md mx-auto space-y-4">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs flex items-center justify-between">
                <span className="text-zinc-500">Target URL:</span>
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
                disabled={runMutation.isPending}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-50"
              >
                {runMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Enqueuing Website Audit...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Run AI Website Audit Now
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="max-w-md mx-auto space-y-4 text-left">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  This lead currently has no recorded website URL. Enter their website below to start the audit.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Business Website URL
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Globe className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                    <input
                      type="url"
                      placeholder="https://example.com"
                      value={websiteInput}
                      onChange={(e) => setWebsiteInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
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
                    disabled={updateAndRunMutation.isPending || !websiteInput.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm disabled:opacity-50 shrink-0"
                  >
                    {updateAndRunMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save & Audit
                  </button>
                </div>
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
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {lead?.business_name || 'Business'} Audit
              </h1>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${scoreBadgeColor}`}>
                Score: {overallScore}/100
              </span>
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
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${runMutation.isPending ? 'animate-spin' : ''}`} />
            {runMutation.isPending ? 'Auditing...' : 'Re-run Audit'}
          </button>

          <Link
            to="/outreach"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Create AI Outreach
          </Link>
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
      </div>
    </div>
  )
}
