import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, ArrowRight, FileText, MapPin, User, Package, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Signal } from '@/data/types';
import { signalTypeConfig } from '@/data/mockData';
import PulseTypeIcon from '@/components/PulseTypeIcon';

interface PulseSearchProps {
  signals: Signal[];
  activeRole: string;
  onSelectSignal: (signal: Signal) => void;
  onFullSearch: (query: string) => void;
}

// Financial shortcut patterns for Rohan
const financialShortcuts = [
  { pattern: /missing\s*po/i, label: 'Missing PO items', filter: (s: Signal) => !s.category || s.flag_reason?.toLowerCase().includes('po') },
  { pattern: /variance/i, label: 'Variance exceptions', filter: (s: Signal) => s.flag_reason?.toLowerCase().includes('variance') || s.signal_type === 'compliance' },
  { pattern: /unmatched/i, label: 'Unmatched invoices', filter: (s: Signal) => s.status === 'needs-clarity' && (s.amount || 0) > 0 },
  { pattern: /overdue/i, label: 'Overdue items', filter: (s: Signal) => s.urgency === 'critical' },
  { pattern: /auto.?match/i, label: 'Auto-matched items', filter: (s: Signal) => s.status === 'auto-approved' },
];

// Status display config
const statusDisplay: Record<string, { label: string; style: string }> = {
  pending: { label: 'New', style: 'bg-signal-amber-bg text-signal-amber' },
  'needs-clarity': { label: 'Awaiting info', style: 'bg-signal-red-bg text-signal-red' },
  approved: { label: 'Approved', style: 'bg-signal-green-bg text-signal-green' },
  'in-motion': { label: 'In progress', style: 'bg-secondary text-foreground' },
  'awaiting-supplier': { label: 'Awaiting others', style: 'bg-secondary text-muted-foreground' },
  'auto-approved': { label: 'Auto-handled', style: 'bg-signal-green-bg text-signal-green' },
  delivered: { label: 'Completed', style: 'bg-signal-green-bg text-signal-green' },
  closed: { label: 'Completed', style: 'bg-signal-green-bg text-signal-green' },
  rejected: { label: 'Rejected', style: 'bg-signal-red-bg text-signal-red' },
};

// Search across all indexed fields
const searchSignal = (signal: Signal, query: string): boolean => {
  const q = query.toLowerCase();
  const fields = [
    signal.title,
    signal.description,
    signal.supplier_suggestion,
    signal.submitter_name,
    signal.location,
    signal.status,
    signal.signal_type,
    signal.category,
    signal.funding,
    signal.flag_reason,
    signal.ai_reasoning,
    signal.amount?.toString(),
    signal.signal_number?.toString(),
  ];
  return fields.some(f => f?.toLowerCase().includes(q));
};

// Group results by category
interface GroupedResults {
  pulses: Signal[];
  suppliers: { name: string; count: number; signals: Signal[] }[];
  people: { name: string; count: number; signals: Signal[] }[];
  locations: { name: string; count: number }[];
}

const groupResults = (signals: Signal[]): GroupedResults => {
  const supplierMap = new Map<string, Signal[]>();
  const peopleMap = new Map<string, Signal[]>();
  const locationSet = new Map<string, number>();

  signals.forEach(s => {
    if (s.supplier_suggestion) {
      const existing = supplierMap.get(s.supplier_suggestion) || [];
      supplierMap.set(s.supplier_suggestion, [...existing, s]);
    }
    const existing = peopleMap.get(s.submitter_name) || [];
    peopleMap.set(s.submitter_name, [...existing, s]);
    locationSet.set(s.location, (locationSet.get(s.location) || 0) + 1);
  });

  return {
    pulses: signals.slice(0, 5),
    suppliers: Array.from(supplierMap.entries()).map(([name, sigs]) => ({ name, count: sigs.length, signals: sigs })).slice(0, 3),
    people: Array.from(peopleMap.entries()).map(([name, sigs]) => ({ name, count: sigs.length, signals: sigs })).slice(0, 3),
    locations: Array.from(locationSet.entries()).map(([name, count]) => ({ name, count })).slice(0, 3),
  };
};

const PulseSearch = ({ signals, activeRole, onSelectSignal, onFullSearch }: PulseSearchProps) => {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isRohan = activeRole === 'rohan';

  // Filter signals by query
  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    return signals.filter(s => searchSignal(s, query));
  }, [signals, query]);

  const grouped = useMemo(() => groupResults(filtered), [filtered]);

  // Financial shortcuts that match current query
  const matchedShortcuts = useMemo(() => {
    if (!isRohan || !query.trim()) return [];
    return financialShortcuts.filter(sc => sc.pattern.test(query));
  }, [query, isRohan]);

  const showDropdown = focused && query.trim().length > 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      onFullSearch(query.trim());
      setFocused(false);
    }
    if (e.key === 'Escape') {
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-sm">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search requests, suppliers, people…"
          className="h-8 pl-8 pr-8 text-xs bg-secondary/50 border-border focus:bg-card"
        />
        {query && (
          <button onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Typeahead dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border bg-popover shadow-lg z-50 overflow-hidden max-h-[420px] overflow-y-auto">
          {/* Financial shortcuts for Rohan */}
          {matchedShortcuts.length > 0 && (
            <div className="p-2 border-b border-border">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1">Quick filters</p>
              {matchedShortcuts.map((sc, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onFullSearch(query.trim());
                    setFocused(false);
                  }}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded-md hover:bg-secondary transition-colors"
                >
                  <AlertTriangle className="h-3 w-3 text-signal-amber shrink-0" />
                  <span className="font-medium">{sc.label}</span>
                  <span className="text-muted-foreground ml-auto">{signals.filter(sc.filter).length} items</span>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {filtered.length === 0 && matchedShortcuts.length === 0 && (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">No results found matching "{query}"</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Try expanding your date range or clearing filters.</p>
            </div>
          )}

          {/* Requests section */}
          {grouped.pulses.length > 0 && (
            <div className="p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1">Requests</p>
              {grouped.pulses.map(signal => {
                const typeInfo = signalTypeConfig[signal.signal_type] || signalTypeConfig.general;
                const status = statusDisplay[signal.status];
                return (
                  <button
                    key={signal.id}
                    onClick={() => { onSelectSignal(signal); setFocused(false); }}
                    className="flex items-center gap-2.5 w-full px-2 py-2 text-left rounded-md hover:bg-secondary transition-colors"
                  >
                    <PulseTypeIcon type={signal.signal_type} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{signal.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {signal.submitter_name} · {signal.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {status && (
                        <Badge className={cn('text-[9px] py-0 px-1 border-0 font-medium', status.style)}>
                          {status.label}
                        </Badge>
                      )}
                      {(signal.amount || 0) > 0 && (
                        <span className="text-[11px] font-semibold tabular-nums">
                          €{(signal.amount || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Suppliers section */}
          {grouped.suppliers.length > 0 && (
            <div className="p-2 border-t border-border">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1">Suppliers</p>
              {grouped.suppliers.map((sup, i) => (
                <button
                  key={i}
                  onClick={() => { onFullSearch(sup.name); setFocused(false); }}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded-md hover:bg-secondary transition-colors"
                >
                  <Package className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="font-medium">{sup.name}</span>
                  <span className="text-muted-foreground ml-auto">{sup.count} items</span>
                </button>
              ))}
            </div>
          )}

          {/* People section */}
          {grouped.people.length > 0 && (
            <div className="p-2 border-t border-border">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1">People</p>
              {grouped.people.map((person, i) => (
                <button
                  key={i}
                  onClick={() => { onFullSearch(person.name); setFocused(false); }}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded-md hover:bg-secondary transition-colors"
                >
                  <User className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="font-medium">{person.name}</span>
                  <span className="text-muted-foreground ml-auto">{person.count} items</span>
                </button>
              ))}
            </div>
          )}

          {/* Locations section */}
          {grouped.locations.length > 0 && (
            <div className="p-2 border-t border-border">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1">Locations</p>
              {grouped.locations.map((loc, i) => (
                <button
                  key={i}
                  onClick={() => { onFullSearch(loc.name); setFocused(false); }}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded-md hover:bg-secondary transition-colors"
                >
                  <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="font-medium">{loc.name}</span>
                  <span className="text-muted-foreground ml-auto">{loc.count} items</span>
                </button>
              ))}
            </div>
          )}

          {/* Full search footer */}
          {filtered.length > 5 && (
            <button
              onClick={() => { onFullSearch(query.trim()); setFocused(false); }}
              className="flex items-center justify-center gap-1.5 w-full px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary border-t border-border transition-colors"
            >
              View all {filtered.length} results <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PulseSearch;
