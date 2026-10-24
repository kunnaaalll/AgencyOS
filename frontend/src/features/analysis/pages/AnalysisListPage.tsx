import React from "react";
import { Link } from "@tanstack/react-router";
import { useAnalysisList, WebsiteAnalysis } from "../api/analysisApi";
import { Globe, ArrowUpRight, CheckCircle2, AlertCircle, BarChart3, ShieldCheck } from "lucide-react";

export const AnalysisListPage: React.FC = () => {
  const { data: analyses, isLoading, isError } = useAnalysisList();

  const list: WebsiteAnalysis[] = Array.isArray(analyses)
    ? (analyses as WebsiteAnalysis[])
    : Array.isArray((analyses as any)?.items)
    ? (analyses as any).items
    : [];

  return (
    <div className="max-w-[1400px] mx-auto px-6 pt-4 space-y-6 pb-16 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Website Audits & Digital Maturity
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Automated deep Playwright browser audits inspecting SEO, mobile responsiveness, call-to-actions, and social authority.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
            {list.length} Audited Websites
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/40 dark:bg-zinc-800/20">
                <th className="py-3.5 px-4 w-[24%]">Business</th>
                <th className="py-3.5 px-4 w-[26%]">Website</th>
                <th className="py-3.5 px-4 w-[11%] text-center">Overall</th>
                <th className="py-3.5 px-4 w-[9%] text-center">SEO</th>
                <th className="py-3.5 px-4 w-[9%] text-center">CTA</th>
                <th className="py-3.5 px-4 w-[11%]">Analyzed At</th>
                <th className="py-3.5 px-4 w-[10%] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading website audits...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-rose-500">
                    Failed to load website analyses.
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Globe className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No website audits completed yet</p>
                    <p className="text-xs text-slate-500 mt-0.5">Audits are generated automatically when leads with websites are discovered.</p>
                  </td>
                </tr>
              ) : (
                list.map((analysis: WebsiteAnalysis) => {
                  const displayName = analysis.business_name || `Business Lead (${analysis.lead_id.slice(0, 8)})`;
                  const score = analysis.overall_score ?? 0;
                  const isHigh = score >= 70;
                  const isMed = score >= 40 && score < 70;

                  return (
                    <tr key={analysis.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3.5 px-4 truncate font-semibold text-slate-900 dark:text-slate-100">
                        <span className="truncate block" title={displayName}>
                          {displayName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 truncate">
                        <a 
                          href={analysis.website_url.startsWith('http') ? analysis.website_url : `https://${analysis.website_url}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium inline-flex items-center gap-1 truncate"
                          title={analysis.website_url}
                        >
                          <span className="truncate">{analysis.website_url}</span>
                          <ArrowUpRight className="w-3 h-3 shrink-0" />
                        </a>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isHigh 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' 
                            : isMed 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                        }`}>
                          {score}/100
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {analysis.seo_score ?? '-'}/100
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {analysis.cta_score ?? '-'}/100
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                        {analysis.analyzed_at ? new Date(analysis.analyzed_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link 
                          to="/leads/$id/analysis" 
                          params={{ id: analysis.lead_id }} 
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 transition-colors"
                        >
                          View Report
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

