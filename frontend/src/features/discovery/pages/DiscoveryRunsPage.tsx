import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { discoveryApi } from '../api/discoveryApi';
import { Link } from '@tanstack/react-router';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckSquare, Square, ChevronDown, Loader2 } from 'lucide-react';

const HARDCODED_LOCATIONS = ["Mumbai", "Navi Mumbai", "Thane"];
const HARDCODED_INDUSTRIES = [
  "dentist", "restaurant", "salon", "spa", "skin clinic", "gym", 
  "interior designer", "architect", "lawyer", "CA", "real estate agent", 
  "school", "coaching class", "hospital", "bakery", "cafe", 
  "hotel", "jeweller", "furniture store", "digital marketing agency"
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
    <div className="relative flex-1 min-w-[200px]" ref={wrapperRef}>
      <label className="block text-claude-body-sm font-semibold text-[var(--color-ink)] tracking-wide uppercase mb-2">{label}</label>
      <div 
        className="flex items-center justify-between h-10 w-full rounded-md border border-[var(--color-hairline)] bg-[var(--color-canvas)] px-3.5 py-2 cursor-pointer text-claude-body-md text-[var(--color-ink)]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate pr-2">
          {selected.length === 0 ? "Select options..." : selected.length === options.length ? "All Selected" : `${selected.length} Selected`}
        </span>
        <ChevronDown className="w-4 h-4 text-[var(--color-muted)]" />
      </div>
      
      {isOpen && (
        <div className="absolute z-10 top-[calc(100%+4px)] left-0 w-full bg-[var(--color-canvas)] border border-[var(--color-hairline)] rounded-md shadow-lg max-h-60 overflow-y-auto py-1">
          <div 
            className="flex items-center px-3 py-2 hover:bg-[var(--color-surface-soft)] cursor-pointer text-claude-body-md font-medium text-[var(--color-ink)] border-b border-[var(--color-hairline)]"
            onClick={toggleAll}
          >
            {allSelected ? <CheckSquare className="w-4 h-4 mr-2 text-[var(--color-primary)]" /> : <Square className="w-4 h-4 mr-2 text-[var(--color-muted)]" />}
            Select All
          </div>
          {options.map(opt => {
            const isSelected = selected.includes(opt.id);
            return (
              <div 
                key={opt.id}
                className="flex items-center px-3 py-2 hover:bg-[var(--color-surface-soft)] cursor-pointer text-claude-body-md text-[var(--color-ink)]"
                onClick={() => toggleOption(opt.id)}
              >
                {isSelected ? <CheckSquare className="w-4 h-4 mr-2 text-[var(--color-primary)]" /> : <Square className="w-4 h-4 mr-2 text-[var(--color-muted)]" />}
                {opt.label}
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

  const { data: runs, isLoading } = useQuery({
    queryKey: ['discovery-runs'],
    queryFn: discoveryApi.getRuns,
    refetchInterval: 5000, // Poll every 5 seconds to see automation progress
  });

  const bulkMutation = useMutation({
    mutationFn: discoveryApi.bulkDiscover,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discovery-runs'] });
      setNotification({ type: 'success', message: 'Bulk run started successfully! The backend orchestrator is now generating tasks.' });
      setTimeout(() => setNotification(null), 8000);
    },
    onError: (error: any) => {
      console.error('Failed to start bulk run:', error);
      setNotification({ type: 'error', message: `Failed to start bulk run: ${error.response?.data?.detail || error.message}` });
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

  return (
    <div className="max-w-[1400px] mx-auto px-6 pt-8 space-y-8 pb-16 animate-fade-in">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-claude-display-lg text-[var(--color-ink)]">Discovery Runs</h1>
          <p className="text-[var(--color-muted)] text-claude-body-md mt-2">Manage and track your lead generation runs.</p>
        </div>
      </div>

      {notification && (
        <div className={`p-4 mb-6 rounded-md border ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
      )}
      
      <Card padding="lg" className="mb-10 overflow-visible">
        <h2 className="text-claude-title-md text-[var(--color-ink)] mb-6">Start Bulk Run</h2>
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
            <label className="block text-claude-body-sm font-semibold text-[var(--color-ink)] tracking-wide uppercase mb-2">Limit</label>
            <Input 
              type="number" 
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              min="1"
              max="100"
            />
          </div>
          <Button 
            type="submit" 
            variant="primary"
            disabled={bulkMutation.isPending}
            className="w-full sm:w-auto mt-4 sm:mt-0"
          >
            {bulkMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : 'Start Bulk Run'}
          </Button>
        </form>
      </Card>

      <Card padding="default">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Query</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Discovered</TableHead>
              <TableHead>Validated</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-[var(--color-muted)] py-8">Loading...</TableCell></TableRow>
            ) : runs?.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-[var(--color-muted)] py-8">No runs found.</TableCell></TableRow>
            ) : runs?.map(run => (
              <TableRow key={run.id}>
                <TableCell className="capitalize">{run.source.replace('_', ' ')}</TableCell>
                <TableCell>{run.query} {run.location ? `in ${run.location}` : ''}</TableCell>
                <TableCell>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                    run.status === 'COMPLETED' ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' :
                    run.status === 'FAILED' ? 'bg-[var(--color-error)]/10 text-[var(--color-error)]' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {run.status}
                  </span>
                </TableCell>
                <TableCell>{run.businesses_discovered}</TableCell>
                <TableCell>{run.businesses_validated}</TableCell>
                <TableCell>{new Date(run.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Link to="/discovery/runs/$id" params={{ id: run.id }} className="text-[var(--color-primary)] hover:underline font-medium">
                    View
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
