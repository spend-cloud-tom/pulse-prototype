import { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Search, Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Signal } from '@/data/types';
import { cn } from '@/lib/utils';
import PulseCard from '@/components/PulseCard';
import PulseDetailDrawer from '@/components/PulseDetailDrawer';

interface SearchResultsViewProps {
  query: string;
  signals: Signal[];
  onClose: () => void;
  onSelectSignal: (signal: Signal) => void;
}

type PulseTypeFilter = 'all' | Signal['signal_type'];
type StatusFilter = 'all' | Signal['status'];
type UrgencyFilter = 'all' | Signal['urgency'];

const searchSignal = (signal: Signal, query: string): boolean => {
  const q = query.toLowerCase();
  const fields = [
    signal.title, signal.description, signal.supplier_suggestion,
    signal.submitter_name, signal.location, signal.status,
    signal.signal_type, signal.category, signal.funding,
    signal.flag_reason, signal.ai_reasoning,
    signal.amount?.toString(), signal.signal_number?.toString(),
  ];
  return fields.some(f => f?.toLowerCase().includes(q));
};

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'New' },
  { value: 'needs-clarity', label: 'Awaiting info' },
  { value: 'approved', label: 'Approved' },
  { value: 'in-motion', label: 'In progress' },
  { value: 'awaiting-supplier', label: 'Awaiting others' },
  { value: 'delivered', label: 'Completed' },
  { value: 'closed', label: 'Closed' },
  { value: 'rejected', label: 'Rejected' },
];

const urgencyOptions: { value: UrgencyFilter; label: string }[] = [
  { value: 'all', label: 'All urgencies' },
  { value: 'critical', label: 'Critical' },
  { value: 'urgent', label: 'High' },
  { value: 'normal', label: 'Normal' },
];

const typeOptions: { value: PulseTypeFilter; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'incident', label: 'Incident' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'event', label: 'Event' },
  { value: 'resource', label: 'Resource' },
  { value: 'shift-handover', label: 'Handover' },
];

const SearchResultsView = ({ query, signals, onClose, onSelectSignal }: SearchResultsViewProps) => {
  const [typeFilter, setTypeFilter] = useState<PulseTypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>('all');
  const [actionOnly, setActionOnly] = useState(false);
  const [drawerSignal, setDrawerSignal] = useState<Signal | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const results = useMemo(() => {
    let filtered = signals.filter(s => searchSignal(s, query));
    if (typeFilter !== 'all') filtered = filtered.filter(s => s.signal_type === typeFilter);
    if (statusFilter !== 'all') filtered = filtered.filter(s => s.status === statusFilter);
    if (urgencyFilter !== 'all') filtered = filtered.filter(s => s.urgency === urgencyFilter);
    if (actionOnly) filtered = filtered.filter(s => s.status === 'pending' || s.status === 'needs-clarity');
    return filtered;
  }, [signals, query, typeFilter, statusFilter, urgencyFilter, actionOnly]);

  const totalExposure = results.reduce((sum, s) => sum + (s.amount || 0), 0);
  const actionCount = results.filter(s => s.status === 'pending' || s.status === 'needs-clarity').length;

  const handleCardClick = (signal: Signal) => {
    setDrawerSignal(signal);
    setDrawerOpen(true);
  };

  const activeFilterCount = [typeFilter !== 'all', statusFilter !== 'all', urgencyFilter !== 'all', actionOnly].filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mx-auto max-w-4xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            Results for "{query}"
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {results.length} {results.length === 1 ? 'result' : 'results'} found
            {totalExposure > 0 && <span> · €{totalExposure.toLocaleString('nl-NL', { minimumFractionDigits: 2 })} total</span>}
            {actionCount > 0 && <span> · {actionCount} need action</span>}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5 text-xs">
          <X className="h-3.5 w-3.5" /> Clear search
        </Button>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        {activeFilterCount > 0 && (
          <Badge variant="outline" className="text-[10px] bg-secondary border-0">
            <Filter className="h-2.5 w-2.5 mr-1" /> {activeFilterCount} active
          </Badge>
        )}
        <FilterChip options={typeOptions} value={typeFilter} onChange={(v) => setTypeFilter(v as PulseTypeFilter)} />
        <FilterChip options={statusOptions} value={statusFilter} onChange={(v) => setStatusFilter(v as StatusFilter)} />
        <FilterChip options={urgencyOptions} value={urgencyFilter} onChange={(v) => setUrgencyFilter(v as UrgencyFilter)} />
        <button
          onClick={() => setActionOnly(!actionOnly)}
          className={cn(
            'text-[11px] px-2.5 py-1 rounded-full border transition-colors',
            actionOnly
              ? 'bg-foreground text-background border-foreground font-medium'
              : 'border-border text-muted-foreground hover:bg-secondary'
          )}
        >
          Needs my action
        </button>
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <Search className="h-8 w-8 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground">
            No results found matching "{query}" with current filters.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => { setTypeFilter('all'); setStatusFilter('all'); setUrgencyFilter('all'); setActionOnly(false); }}
          >
            Clear all filters
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((signal, i) => (
            <motion.div
              key={signal.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <PulseCard
                signal={signal}
                variant={
                  signal.status === 'delivered' || signal.status === 'closed' || signal.status === 'auto-approved'
                    ? 'completed'
                    : signal.status === 'in-motion' || signal.status === 'awaiting-supplier' || signal.status === 'approved'
                      ? 'progress'
                      : 'action'
                }
                dense
                onClick={() => handleCardClick(signal)}
              />
            </motion.div>
          ))}
        </div>
      )}

      <PulseDetailDrawer signal={drawerSignal} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </motion.div>
  );
};

// Reusable filter chip with dropdown
const FilterChip = ({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);
  const isActive = value !== 'all';

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'text-[11px] px-2.5 py-1 rounded-full border flex items-center gap-1 transition-colors',
          isActive
            ? 'bg-foreground text-background border-foreground font-medium'
            : 'border-border text-muted-foreground hover:bg-secondary'
        )}
      >
        {selected?.label}
        <ChevronDown className="h-2.5 w-2.5" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-40 rounded-lg border border-border bg-popover shadow-lg z-50 py-1">
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(
                'flex w-full items-center px-3 py-1.5 text-xs transition-colors',
                value === opt.value ? 'bg-secondary font-medium' : 'hover:bg-secondary/50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResultsView;
