import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { discoveryApi } from '../api/discoveryApi';
import {
  Radio,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Globe,
  Phone,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Filter,
  Check,
} from 'lucide-react';

export function RawBusinessesPage() {
  const queryClient = useQueryClient();
  const [filterValidOnly, setFilterValidOnly] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: businesses, isLoading } = useQuery({
    queryKey: ['raw-businesses'],
    queryFn: () => discoveryApi.getBusinesses({ limit: 100 }),
  });

  const promoteMutation = useMutation({
    mutationFn: discoveryApi.promoteBusiness,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setFeedbackMessage({ type: 'success', text: 'Business promoted to All Leads CRM and queued for website audit & AI qualification!' });
    },
    onError: (error: any) => {
      setFeedbackMessage({ type: 'error', text: `Failed to promote: ${error?.response?.data?.detail || error.message}` });
    }
  });

  const batchPromoteMutation = useMutation({
    mutationFn: () => discoveryApi.promoteAllValid(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['raw-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setFeedbackMessage({ type: 'success', text: data.message || `Promoted ${data.promoted_count} valid businesses to CRM!` });
    },
    onError: (error: any) => {
      setFeedbackMessage({ type: 'error', text: `Batch promotion failed: ${error?.response?.data?.detail || error.message}` });
    }
  });

  const rawItems: any[] = (businesses as any)?.items || (Array.isArray(businesses) ? businesses : []);
  const displayedItems = filterValidOnly 
    ? rawItems.filter((b) => b.validation_status === 'VALID')
    : rawItems;

  const validCount = rawItems.filter((b) => b.validation_status === 'VALID').length;
  const promotedCount = rawItems.filter((b) => !!b.enriched_at).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Informational Pipeline Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-indigo-500/20">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                Inbound Radar Stream
              </span>
              <span className="text-xs text-slate-400">Step 1 of Agency Pipeline</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Lead Discovery (Scraped Stream)</h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              This radar streams raw business records discovered 24/7 across Google Maps & Web. Validated records can be promoted directly into your <strong className="text-white">All Leads CRM</strong> to initiate Playwright audits and autonomous AI qualification.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => batchPromoteMutation.mutate()}
              disabled={batchPromoteMutation.isPending || validCount === 0}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
            >
              {batchPromoteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Syncing All to CRM...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  ⚡ Auto-Promote All Valid to CRM
                </>
              )}
            </button>

            <Link
              to="/leads"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/10 transition-all"
            >
              Open All Leads CRM
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-white/10 text-xs">
          <div>
            <span className="text-slate-400 block">Total Discovered:</span>
            <span className="text-lg font-bold text-white">{rawItems.length} Records</span>
          </div>
          <div>
            <span className="text-slate-400 block">Validated & Clean:</span>
            <span className="text-lg font-bold text-emerald-400">{validCount} Verified</span>
          </div>
          <div>
            <span className="text-slate-400 block">Promoted to CRM:</span>
            <span className="text-lg font-bold text-purple-300">{promotedCount} Active Leads</span>
          </div>
        </div>
      </div>

      {feedbackMessage && (
        <div className={`p-4 rounded-xl border text-sm flex items-center justify-between transition-all ${
          feedbackMessage.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' 
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs font-semibold hover:underline opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Discovered Inbound Queue</h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 text-xs font-medium">
              Showing {displayedItems.length} records
            </span>
          </div>

          <button
            onClick={() => setFilterValidOnly(!filterValidOnly)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filterValidOnly
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300'
                : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-slate-300'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {filterValidOnly ? 'Showing Valid Records Only' : 'Show All Records'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-zinc-800/20">
                <th className="py-3 px-4 w-[26%]">Business</th>
                <th className="py-3 px-4 w-[13%]">Industry</th>
                <th className="py-3 px-4 w-[16%]">Website</th>
                <th className="py-3 px-4 w-[15%]">Phone</th>
                <th className="py-3 px-4 w-[10%]">Source</th>
                <th className="py-3 px-4 w-[8%] text-center">Status</th>
                <th className="py-3 px-4 w-[12%] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                      Loading discovered businesses...
                    </div>
                  </td>
                </tr>
              ) : displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No businesses matching the selected filter.
                  </td>
                </tr>
              ) : (
                displayedItems.map((business: any) => {
                  const isPromoted = !!business.enriched_at;
                  return (
                    <tr key={business.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-4 truncate font-medium text-slate-900 dark:text-slate-100">
                        <div className="truncate" title={business.business_name}>
                          {business.business_name}
                        </div>
                        {business.city && (
                          <div className="text-[11px] text-slate-400 truncate">
                            {business.city}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs capitalize text-slate-600 dark:text-slate-400 truncate">
                        {business.industry || '-'}
                      </td>
                      <td className="py-3 px-4 text-xs truncate">
                        {business.website ? (
                          <a
                            href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 truncate"
                            title={business.website}
                          >
                            <Globe className="w-3 h-3 shrink-0" />
                            <span className="truncate">{business.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No Website (Offline)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-700 dark:text-slate-300 truncate">
                        {business.phone ? (
                          <a href={`tel:${business.phone}`} className="hover:underline flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{business.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs capitalize text-slate-500 truncate">
                        {business.source ? business.source.replace('_', ' ') : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          business.validation_status === 'VALID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : business.validation_status === 'INVALID'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {business.validation_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isPromoted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                            <Check className="w-3 h-3 text-emerald-600" />
                            In CRM
                          </span>
                        ) : (
                          <button
                            onClick={() => promoteMutation.mutate(business.id)}
                            disabled={promoteMutation.isPending}
                            className="inline-flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                          >
                            Promote
                          </button>
                        )}
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
}
