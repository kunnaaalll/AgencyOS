import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { discoveryApi } from '../api/discoveryApi';
import { Link } from '@tanstack/react-router';
import { Input } from '@/components/ui/input';
import { 
  Check, 
  ChevronDown, 
  Loader2, 
  Sparkles, 
  Play, 
  Search, 
  Globe, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Activity,
  Radio,
  Zap,
  Server,
  ShieldCheck,
  Layers
} from 'lucide-react';

const HARDCODED_LOCATIONS = ["Mumbai", "Navi Mumbai", "Thane"];
const HARDCODED_INDUSTRIES = [
  "production house",
  "film production company",
  "ad film production",
  "OTT platform",
  "media agency",
  "video production studio",
  "animation studio",
  "D2C brand",
  "online clothing brand",
  "ecommerce brand",
  "SaaS startup",
  "edtech platform",
  "cloud kitchen",
  "luxury real estate",
  "interior designer",
  "architect",
  "corporate law firm",
  "wealth management",
  "event management company",
  "wedding planner",
  "skin clinic",
  "aesthetic clinic",
  "cosmetic surgeon",
  "IVF centre",
  "dentist",
  "hospital",
  "gym",
  "fitness studio",
  "luxury salon",
  "spa",
  "fine dining restaurant",
  "hotel",
  "resort",
  "jeweller"
];
const HARDCODED_SOURCES = [
  { id: "google_maps", label: "🗺 Google Maps" },
  { id: "google_search", label: "🔍 Google Search" },
  { id: "justdial", label: "📞 JustDial" },
  { id: "indiamart", label: "🏭 IndiaMart" },
  { id: "clutch", label: "⭐ Clutch" },
  { id: "reddit", label: "💬 Reddit" }
];

function MultiSelectDropdown({ 
  label, 
  options, 
  selected, 
  onChange 
}: { 
  label: string; 
  options: { id: string; label: string }[]; 
  selected: string[]; 
  onChange: (val: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allSelected = selected.length === options.length;

  const toggleAll = () => {
    if (allSelected) onChange([]);
    else onChange(options.map(o => o.id));
  };

  const toggleOption = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter(x => x !== id));
    else onChange([...selected, id]);
  };

  return (
    <div className="relative flex-1 min-w-[220px]" ref={wrapperRef}>
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
        {label}
      </label>
      <div 
        className="flex items-center justify-between h-10 w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2 cursor-pointer text-sm text-slate-900 dark:text-slate-100 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-xs transition-all select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate pr-2 font-medium">
          {selected.length === 0 ? (
            <span className="text-slate-400 font-normal">Select {label.toLowerCase()}...</span>
          ) : selected.length === options.length ? (
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
              All Selected ({options.length})
            </span>
          ) : (
            <span className="text-slate-900 dark:text-slate-100 font-semibold">
              {selected.length} Selected
            </span>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="absolute z-50 top-[calc(100%+6px)] left-0 w-full min-w-[240px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl max-h-72 overflow-y-auto py-1.5 backdrop-blur-xl">
          <div 
            className="flex items-center justify-between px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer text-sm font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-zinc-800 mb-1 select-none"
            onClick={toggleAll}
          >
            <span>Select All ({options.length})</span>
            {allSelected ? (
              <div className="w-4 h-4 rounded bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            ) : (
              <div className="w-4 h-4 rounded border border-slate-300 dark:border-zinc-700 shrink-0" />
            )}
          </div>
          {options.map(opt => {
            const isSelected = selected.includes(opt.id);
            return (
              <div 
                key={opt.id}
                className={`flex items-center justify-between px-3.5 py-2 text-sm cursor-pointer transition-colors select-none ${
                  isSelected 
                    ? 'bg-indigo-50/80 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200 font-medium' 
                    : 'hover:bg-slate-50 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-slate-300'
                }`}
                onClick={() => toggleOption(opt.id)}
              >
                <span className="truncate pr-2">{opt.label}</span>
                {isSelected ? (
                  <div className="w-4 h-4 rounded bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded border border-slate-300 dark:border-zinc-700 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DiscoveryRunsPage() {
  const queryClient = useQueryClient();
  
  const [sources, setSources] = useState<string[]>(HARDCODED_SOURCES.map(s => s.id));
  const [industries, setIndustries] = useState<string[]>(HARDCODED_INDUSTRIES);
  const [locations, setLocations] = useState<string[]>(HARDCODED_LOCATIONS);
  const [limit, setLimit] = useState(10);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // 24/7 Crawler Engine Status
  const { data: crawlerStatus } = useQuery({
    queryKey: ['crawler-status'],
    queryFn: discoveryApi.getCrawlerStatus,
    refetchInterval: 5000,
  });

  const { data: runs, isLoading } = useQuery({
    queryKey: ['discovery-runs'],
    queryFn: discoveryApi.getRuns,
    refetchInterval: 5000,
  });

  const sweepMutation = useMutation({
    mutationFn: discoveryApi.triggerCrawlerSweep,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['discovery-runs'] });
      queryClient.invalidateQueries({ queryKey: ['crawler-status'] });
      setNotification({
        type: 'success',
        message: `Immediate 24/7 Crawl Sweep launched across ${data.sectors.length} sectors! Background workers are actively collecting new leads.`,
      });
      setTimeout(() => setNotification(null), 8000);
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail || error.message || 'Failed to trigger sweep.';
      setNotification({ type: 'error', message: `Sweep trigger failed: ${detail}` });
      setTimeout(() => setNotification(null), 8000);
    },
  });

  const bulkMutation = useMutation({
    mutationFn: discoveryApi.bulkDiscover,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discovery-runs'] });
      queryClient.invalidateQueries({ queryKey: ['crawler-status'] });
      setNotification({ type: 'success', message: 'Bulk run started successfully! The backend orchestrator is executing crawler tasks.' });
      setTimeout(() => setNotification(null), 8000);
    },
    onError: (error: any) => {
      console.error('Failed to start bulk run:', error);
      const detail = error.response?.data?.detail || error.message || 'An error occurred. Please try again.';
      setNotification({ type: 'error', message: `Failed to start bulk run: ${detail}` });
      setTimeout(() => setNotification(null), 8000);
    }
  });

  const handleStartRun = (e: React.FormEvent) => {
    e.preventDefault();
    if (sources.length === 0 || industries.length === 0 || locations.length === 0) {
      setNotification({ type: 'error', message: "Please select at least one source, industry, and location." });
      setTimeout(() => setNotification(null), 5000);
      return;
    }
    bulkMutation.mutate({
      sources,
      industries,
      locations,
      limit_per_query: limit
    });
  };

  const getSourceIcon = (source: string) => {
    if (source.includes('maps')) return '🗺';
    if (source.includes('search')) return '🔍';
    if (source.includes('justdial')) return '📞';
    if (source.includes('indiamart')) return '🏭';
    if (source.includes('clutch')) return '⭐';
    if (source.includes('reddit')) return '💬';
    return '🌐';
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 pt-4 space-y-6 pb-16 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Lead Discovery Runs
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Automate multi-source prospecting across Google Maps, Google Search, and enterprise directories.
          </p>
        </div>
      </div>

      {/* 24/7 Autonomous Crawler Engine Telemetry Card */}
      <div className="bg-gradient-to-br from-slate-950 via-zinc-900 to-indigo-950 text-white rounded-2xl border border-indigo-500/30 p-6 sm:p-7 shadow-xl shadow-indigo-950/20 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="flex items-start sm:items-center gap-4">
            {/* Pulsing 24/7 Beacon */}
            <div className="relative flex items-center justify-center shrink-0">
              <span className="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-emerald-400 opacity-30"></span>
              <div className="relative inline-flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-500/20">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  24/7 Autonomous Lead Crawler Engine
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  ACTIVE & RUNNING 24/7
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  <Radio className="w-3 h-3 text-indigo-400 animate-pulse" />
                  Continuous Auto-Cycle
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                The autonomous system is continuously patrolling Google Maps, Google Search, and enterprise business directories across all 34 commercial sectors 24/7 to discover, validate, and qualify new clients round the clock.
              </p>
            </div>
          </div>

          {/* Right controls: Trigger Immediate Sweep */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => sweepMutation.mutate()}
              disabled={sweepMutation.isPending}
              className="h-10 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-400/40 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              title="Trigger an immediate multi-sector discovery run right now"
            >
              {sweepMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dispatching Sweep...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>Trigger Immediate 24/7 Sweep</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Telemetry Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          {/* Card 1: Engine Status */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 mb-1.5">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              System State
            </div>
            <div className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {crawlerStatus?.is_crawling ? "Crawling Active" : "Patrolling 24/7"}
            </div>
            <div className="text-xs text-slate-400 mt-1 font-medium truncate">
              ARQ Daemon + Chromium Cluster
            </div>
          </div>

          {/* Card 2: Multi-Sector Scope */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 mb-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Coverage Scope
            </div>
            <div className="text-base sm:text-lg font-extrabold text-white">
              {crawlerStatus?.sectors_monitored || 34} Sectors Covered
            </div>
            <div className="text-xs text-slate-400 mt-1 font-medium truncate">
              OTT, Production, D2C, SaaS & more
            </div>
          </div>

          {/* Card 3: Autonomous Schedule */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 mb-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Crawling Cadence
            </div>
            <div className="text-base sm:text-lg font-extrabold text-white">
              Every 15 Minutes
            </div>
            <div className="text-xs text-slate-400 mt-1 font-medium truncate">
              96 Autonomous Sweeps / Day
            </div>
          </div>

          {/* Card 4: Verified Pipeline */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              Discovery Yield
            </div>
            <div className="text-base sm:text-lg font-extrabold text-white">
              {crawlerStatus?.metrics?.total_discovered ?? (runs?.length ? runs.reduce((a, b) => a + (b.businesses_discovered || 0), 0) : 0)} Discovered
            </div>
            <div className="text-xs text-emerald-400 mt-1 font-semibold truncate">
              {crawlerStatus?.metrics?.total_validated ?? (runs?.length ? runs.reduce((a, b) => a + (b.businesses_validated || 0), 0) : 0)} Validated & Qualified
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
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
      
      {/* Bulk Discovery Form Card (Z-index high to ensure dropdown floats above table) */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8 relative z-20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Start Multi-Source Bulk Crawl
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure target channels, verticals, and geographies.
            </p>
          </div>
        </div>

        <form onSubmit={handleStartRun} className="flex gap-4 items-end flex-wrap">
          <MultiSelectDropdown 
            label="Sources"
            options={HARDCODED_SOURCES}
            selected={sources}
            onChange={setSources}
          />
          <MultiSelectDropdown 
            label="Industries"
            options={HARDCODED_INDUSTRIES.map(i => ({ id: i, label: i.charAt(0).toUpperCase() + i.slice(1) }))}
            selected={industries}
            onChange={setIndustries}
          />
          <MultiSelectDropdown 
            label="Locations"
            options={HARDCODED_LOCATIONS.map(l => ({ id: l, label: l }))}
            selected={locations}
            onChange={setLocations}
          />
          <div className="w-24">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Limit
            </label>
            <Input 
              type="number" 
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              min="1"
              max="100"
              className="h-10 rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-slate-100 font-semibold"
            />
          </div>
          <button 
            type="submit" 
            disabled={bulkMutation.isPending}
            className="h-10 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
          >
            {bulkMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Launching...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white" />
                <span>Start Bulk Run</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Discovery Runs Table Card (Z-index normal) */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden relative z-0">
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between bg-slate-50/60 dark:bg-zinc-800/30">
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Live Discovery Pipeline Runs
            </h3>
            {Array.isArray(runs) && runs.length > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/50 dark:border-indigo-800/40">
                {runs.length} runs
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Auto-refresh active (5s)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/40 dark:bg-zinc-800/20">
                <th className="py-3.5 px-4 w-[16%]">Source</th>
                <th className="py-3.5 px-4 w-[26%]">Query & Location</th>
                <th className="py-3.5 px-4 w-[16%]">Status</th>
                <th className="py-3.5 px-4 w-[10%] text-center">Discovered</th>
                <th className="py-3.5 px-4 w-[11%] text-center">Validated</th>
                <th className="py-3.5 px-4 w-[11%]">Created Date</th>
                <th className="py-3.5 px-4 w-[10%] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center text-slate-500 py-12">
                    <div className="flex items-center justify-center gap-2 font-medium">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      Loading pipeline runs...
                    </div>
                  </td>
                </tr>
              ) : (!Array.isArray(runs) || runs.length === 0) ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Search className="w-10 h-10 mb-2 stroke-[1.5]" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">No discovery runs found</p>
                      <p className="text-xs text-slate-500 mt-0.5">Start your first bulk run above to populate leads.</p>
                    </div>
                  </td>
                </tr>
              ) : runs.map(run => (
                <tr key={run.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200 truncate">
                    <span className="inline-flex items-center gap-1.5 capitalize truncate" title={run.source}>
                      <span>{getSourceIcon(run.source)}</span>
                      <span className="truncate">{run.source ? run.source.replace('_', ' ') : 'Google Maps'}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 truncate">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 capitalize truncate" title={run.query || ''}>
                      {run.query}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                      {run.location ? run.location : 'Mumbai'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {run.status === 'COMPLETED' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        COMPLETED
                      </span>
                    ) : run.status === 'FAILED' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        FAILED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60">
                        <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                        {run.status}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-slate-100">
                      {run.businesses_discovered}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
                      {run.businesses_validated} valid
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                    {new Date(run.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link 
                      to="/discovery/runs/$id" 
                      params={{ id: run.id }} 
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                      View Details
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
