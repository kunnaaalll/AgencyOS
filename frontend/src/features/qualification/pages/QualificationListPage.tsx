import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qualificationApi, QualificationResponse } from '../api/qualificationApi';
import { Link } from '@tanstack/react-router';
import { Sparkles, Brain, ArrowUpRight, Flame, CheckCircle2, AlertCircle, Loader2, Zap, ShieldCheck } from 'lucide-react';

export const QualificationListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: qualifications, isLoading, error } = useQuery({
    queryKey: ['qualifications'],
    queryFn: qualificationApi.getQualifications,
    refetchInterval: 5000,
  });

  const batchMutation = useMutation({
    mutationFn: qualificationApi.batchQualifyAll,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['qualifications'] });
      setNotification({
        type: 'success',
        message: data.message || `Successfully analyzed and qualified ${data.qualified_count} leads with AI!`,
      });
      setTimeout(() => setNotification(null), 8000);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to execute batch AI qualification';
      setNotification({ type: 'error', message: msg });
      setTimeout(() => setNotification(null), 8000);
    },
  });

  const list: QualificationResponse[] = Array.isArray(qualifications)
    ? (qualifications as QualificationResponse[])
    : Array.isArray((qualifications as any)?.items)
    ? (qualifications as any).items
    : [];

  const highPriorityCount = list.filter(q => q.priority === 'HIGH').length;
  const avgScore = list.length > 0 ? Math.round(list.reduce((acc, q) => acc + (q.opportunity_score || 0), 0) / list.length) : 0;

  return (
    <div className="max-w-[1400px] mx-auto px-6 pt-4 space-y-6 pb-16 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            AI Client Qualifications
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold border border-purple-200/50 dark:border-purple-800/40">
              {list.length} Qualified Prospects
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Autonomous AI evaluating digital maturity, deficit analysis, market opportunity, and packaging retainer proposals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => batchMutation.mutate()}
            disabled={batchMutation.isPending}
            className="h-10 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-500/25 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 select-none"
          >
            {batchMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running AI Qualifications...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Qualify All Leads with AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300' 
            : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <p className="text-sm font-semibold">{notification.message}</p>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5 mb-1">
            <Brain className="w-3.5 h-3.5 text-purple-600" />
            AI Evaluated
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {list.length} Leads
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Deep profile & deficits analyzed</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5 mb-1">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            High Priority
          </div>
          <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
            {highPriorityCount} Leads
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Immediate closing opportunities</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Avg Opportunity Score
          </div>
          <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {avgScore}/100
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Growth & revenue potential</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Target Retainers
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            ₹50k-₹1.2L/mo
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Proposed service packages</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/40 dark:bg-zinc-800/20">
                <th className="py-3.5 px-4 w-[24%]">Business Name</th>
                <th className="py-3.5 px-4 w-[11%]">Priority</th>
                <th className="py-3.5 px-4 w-[10%] text-center">Score</th>
                <th className="py-3.5 px-4 w-[14%]">Status</th>
                <th className="py-3.5 px-4 w-[22%]">Recommended Retainer</th>
                <th className="py-3.5 px-4 w-[9%] text-center">Confidence</th>
                <th className="py-3.5 px-4 w-[10%] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                      Loading qualifications...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-rose-500 font-medium">
                    Failed to load qualifications.
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Brain className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No AI qualifications generated yet</p>
                    <p className="text-xs text-slate-500 mt-1 mb-4">Click below to run autonomous AI qualification across all discovered leads.</p>
                    <button
                      onClick={() => batchMutation.mutate()}
                      disabled={batchMutation.isPending}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-sm transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Run AI Qualification on All Leads Now
                    </button>
                  </td>
                </tr>
              ) : (
                list.map((q: QualificationResponse) => (
                  <tr key={q.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100 truncate">
                      <span className="truncate block" title={q.business_name || q.lead_id}>
                        {q.business_name || `Lead (${q.lead_id.slice(0, 8)})`}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        q.priority === 'HIGH' 
                          ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' 
                          : q.priority === 'MEDIUM' 
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800' 
                          : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-zinc-800 dark:text-slate-300'
                      }`}>
                        {q.priority === 'HIGH' && <Flame className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />}
                        {q.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-slate-100">
                        {q.opportunity_score}/100
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {q.qualification_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700 dark:text-slate-300 truncate" title={q.recommended_package || '-'}>
                      {q.recommended_package || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs font-bold text-slate-600 dark:text-slate-400">
                      {(q.confidence * 100).toFixed(0)}%
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link 
                        to="/leads/$id/analysis" 
                        params={{ id: q.lead_id }} 
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 transition-colors"
                      >
                        Audit Pitch
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

