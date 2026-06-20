import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from '@tanstack/react-router'
import { fetchLeadById, fetchLeadAnalysisById } from '../api'
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, TrendingUp, BarChart3, Search, Star, MousePointerClick, Activity } from 'lucide-react'

export function LeadAnalysisPage() {
  const { id } = useParams({ strict: false }) as { id: string }

  const { data: lead } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => fetchLeadById(id),
  })

  const { data: analysis, isLoading, error } = useQuery({
    queryKey: ['analysis', id],
    queryFn: () => fetchLeadAnalysisById(id),
    retry: 1,
  })

  if (isLoading) {
    return <div className="p-8 text-center text-surface-500">Loading analysis data...</div>
  }

  if (error || !analysis) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">No analysis available for this lead.</p>
        <Link to="/leads/$id" params={{ id }} className="text-blue-600 hover:underline">
          Return to lead details
        </Link>
      </div>
    )
  }

  const scores = [
    { label: 'Website Quality', score: analysis.website_score, icon: Globe, max: 20 },
    { label: 'SEO', score: analysis.seo_score, icon: Search, max: 20 },
    { label: 'Instagram', score: analysis.instagram_score, icon: Globe, max: 15 },
    { label: 'Google Reviews', score: analysis.reviews_score, icon: Star, max: 15 },
    { label: 'CTA Quality', score: analysis.cta_score, icon: MousePointerClick, max: 10 },
    { label: 'Business Activity', score: analysis.digital_maturity_score, icon: Activity, max: 10 },
  ]
  // Note: Using a placeholder Globe icon as we didn't import Globe, will add it to the import.

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/leads/$id" params={{ id }} className="p-2 hover:bg-surface-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-surface-500" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Analysis: {lead?.business_name || 'Lead'}</h2>
          <div className="flex items-center gap-3 mt-1 text-sm text-surface-500">
            <span>Total Score: {analysis.total_score}/100</span>
            <span>Analyzed on {new Date(analysis.analyzed_at || analysis.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-surface-200 p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Summary</h3>
            <p className="text-surface-700 leading-relaxed">{analysis.summary || 'No summary generated.'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-surface-200 p-6">
              <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Strengths
              </h3>
              <ul className="space-y-3">
                {analysis.strengths.length > 0 ? analysis.strengths.map((str, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-surface-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                    <span>{str}</span>
                  </li>
                )) : <li className="text-sm text-surface-500">No strengths identified.</li>}
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-surface-200 p-6">
              <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Weaknesses
              </h3>
              <ul className="space-y-3">
                {analysis.weaknesses.length > 0 ? analysis.weaknesses.map((weak, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-surface-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <span>{weak}</span>
                  </li>
                )) : <li className="text-sm text-surface-500">No weaknesses identified.</li>}
              </ul>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-surface-200 p-6">
              <h3 className="text-lg font-semibold text-amber-700 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Pain Points
              </h3>
              <ul className="space-y-3">
                {analysis.pain_points.length > 0 ? analysis.pain_points.map((pp, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-surface-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{pp}</span>
                  </li>
                )) : <li className="text-sm text-surface-500">No pain points identified.</li>}
              </ul>
            </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-surface-200 p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Score Breakdown
            </h3>
            <div className="space-y-5">
              {scores.map((s, i) => {
                const Icon = s.icon
                const percent = ((s.score || 0) / s.max) * 100
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-surface-700">
                        {Icon ? <Icon className="w-4 h-4 text-surface-400" /> : null}
                        {s.label}
                      </div>
                      <span className="text-sm font-semibold">{s.score || 0}/{s.max}</span>
                    </div>
                    <div className="w-full bg-surface-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${percent >= 80 ? 'bg-green-500' : percent >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Globe(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  )
}
