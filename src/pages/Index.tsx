import { useState, useRef, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { RoleProvider, useRole } from '@/context/RoleContext';
import { SystemHealthProvider } from '@/context/SystemHealthContext';
import AutomationBanner from '@/components/AutomationBanner';
import RoleToggle from '@/components/RoleToggle';
import { FilterState } from '@/components/GlobalFilters';
import PulseSearch from '@/components/PulseSearch';
import SearchResultsView from '@/components/SearchResultsView';
import PulseDetailDrawer from '@/components/PulseDetailDrawer';
import NotificationDrawer from '@/components/NotificationDrawer';
import AnoukView from '@/components/views/AnoukView';
import RohanView from '@/components/views/RohanView';
import SarahView from '@/components/views/SarahView';
import JolandaView from '@/components/views/JolandaView';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Bell, LogOut, ChevronDown, MapPin, Calendar, Filter } from 'lucide-react';
import OmniDock from '@/components/OmniDock';
import CommandPalette from '@/components/CommandPalette';
import { Signal, statusToPulseState } from '@/data/types';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
   INLINE FILTERS — Subtle contextual filters above feed content
   ───────────────────────────────────────────────────────────────────────────── */
const InlineFilters = ({ 
  filters, 
  onFiltersChange 
}: { 
  filters: FilterState; 
  onFiltersChange: (f: FilterState) => void;
}) => {
  const locations = ['All locations', 'Zonneweide', 'De Berk', 'Het Anker'];
  const dateOptions = [
    { value: 'today' as const, label: 'Today' },
    { value: 'week' as const, label: 'This week' },
    { value: 'month' as const, label: 'This month' },
  ];

  return (
    <div className="flex items-center gap-4 text-sm text-slate-500">
      {/* Location filter */}
      <Popover>
        <PopoverTrigger className="flex items-center gap-1 hover:text-slate-700 transition-colors">
          <MapPin className="h-3.5 w-3.5" />
          <span>{filters.location}</span>
          <ChevronDown className="h-3 w-3" />
        </PopoverTrigger>
        <PopoverContent className="w-40 p-1" align="start">
          {locations.map(loc => (
            <button
              key={loc}
              onClick={() => onFiltersChange({ ...filters, location: loc })}
              className={cn(
                'flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors',
                filters.location === loc ? 'bg-slate-100 font-medium text-slate-900' : 'hover:bg-slate-50 text-slate-600'
              )}
            >
              {loc}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      <span className="text-slate-300">·</span>

      {/* Date filter */}
      <Popover>
        <PopoverTrigger className="flex items-center gap-1 hover:text-slate-700 transition-colors">
          <Calendar className="h-3.5 w-3.5" />
          <span>{dateOptions.find(d => d.value === filters.dateRange)?.label}</span>
          <ChevronDown className="h-3 w-3" />
        </PopoverTrigger>
        <PopoverContent className="w-36 p-1" align="start">
          {dateOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => onFiltersChange({ ...filters, dateRange: opt.value })}
              className={cn(
                'flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors',
                filters.dateRange === opt.value ? 'bg-slate-100 font-medium text-slate-900' : 'hover:bg-slate-50 text-slate-600'
              )}
            >
              {opt.label}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      <span className="text-slate-300">·</span>

      {/* My Pulses toggle */}
      <button
        onClick={() => onFiltersChange({ ...filters, myActionOnly: !filters.myActionOnly })}
        className={cn(
          'flex items-center gap-1 transition-colors',
          filters.myActionOnly ? 'text-teal-600 font-medium' : 'hover:text-slate-700'
        )}
      >
        <Filter className="h-3.5 w-3.5" />
        <span>My Pulses</span>
      </button>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   USER AVATAR MENU — Clean popover with logout inside
   ───────────────────────────────────────────────────────────────────────────── */
const UserAvatarMenu = ({ onLogout }: { onLogout: () => void }) => {
  const { activeRole } = useRole();
  
  const roleNames: Record<string, string> = {
    anouk: 'Anouk van Dijk',
    rohan: 'Rohan Mehta',
    sarah: 'Sarah de Vries',
    jolanda: 'Jolanda Bakker',
  };

  const roleInitials: Record<string, string> = {
    anouk: 'AD',
    rohan: 'RM',
    sarah: 'SV',
    jolanda: 'JB',
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-xs font-semibold text-teal-700 hover:bg-teal-200 transition-colors">
          {roleInitials[activeRole] || 'U'}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end">
        <div className="px-2 py-1.5 mb-1">
          <p className="text-sm font-medium text-slate-900">{roleNames[activeRole]}</p>
          <p className="text-xs text-slate-500 capitalize">{activeRole}</p>
        </div>
        <div className="border-t border-slate-100 pt-1">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log out
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   COLLAPSIBLE SEARCH — Icon that expands to full search
   ───────────────────────────────────────────────────────────────────────────── */
const CollapsibleSearch = ({ 
  signals, 
  activeRole, 
  onSelectSignal, 
  onFullSearch 
}: {
  signals: Signal[];
  activeRole: string;
  onSelectSignal: (s: Signal) => void;
  onFullSearch: (q: string) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
      >
        <Search className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div ref={containerRef} className="absolute inset-x-0 top-0 bg-white z-50 px-4 py-2 shadow-sm">
      <div className="max-w-[800px] mx-auto">
        <PulseSearch
          signals={signals}
          activeRole={activeRole}
          onSelectSignal={(s) => { onSelectSignal(s); setExpanded(false); }}
          onFullSearch={(q) => { onFullSearch(q); setExpanded(false); }}
        />
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN APP
   ───────────────────────────────────────────────────────────────────────────── */
const PulseApp = () => {
  const { activeRole, signals } = useRole();
  const navigate = useNavigate();
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    location: 'All locations',
    dateRange: 'today',
    myActionOnly: false,
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [searchDrawerSignal, setSearchDrawerSignal] = useState<Signal | null>(null);
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);

  const handleSelectSignal = (signal: Signal) => {
    setSearchDrawerSignal(signal);
    setSearchDrawerOpen(true);
  };

  const handleFullSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCloseSearch = () => {
    setSearchQuery(null);
  };

  const isSearchActive = searchQuery !== null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Fixed floating persona switcher for demo */}
      <RoleToggle fixed />
      
      <AutomationBanner />

      {/* ─── HEADER WITH FILTERS ─── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md">
        {/* Top row: Logo + Actions */}
        <div className="max-w-[800px] mx-auto flex items-center justify-between px-5 py-3">
          {/* Logo — friendly typographic "pulse." with Nunito rounded font + health dot */}
          <div className="flex items-center gap-3">
            <div className="flex items-baseline">
              <span 
                className="text-[26px] font-extrabold tracking-tight lowercase"
                style={{ 
                  fontFamily: "'Nunito', sans-serif",
                  color: 'hsl(200, 45%, 35%)'  /* Calming deep teal */
                }}
              >
                pulse
              </span>
              <span 
                className="text-[26px] font-extrabold"
                style={{ 
                  fontFamily: "'Nunito', sans-serif",
                  color: 'hsl(12, 76%, 61%)'  /* Soft coral accent - the "heartbeat" */
                }}
              >
                .
              </span>
            </div>
          </div>

          {/* Right side — Search icon, Notifications, Avatar */}
          <div className="flex items-center gap-2">
            {/* Collapsible search icon */}
            <button
              onClick={() => setSearchExpanded(true)}
              className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Notifications */}
            <NotificationDrawer role={activeRole} />

            {/* User avatar with popover menu */}
            <UserAvatarMenu onLogout={() => navigate('/')} />
          </div>
        </div>

        {/* Filter row: Location, Date, My Actions — always visible */}
        <div className="max-w-[800px] mx-auto px-5 pb-3">
          <InlineFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Expanded search overlay */}
        <AnimatePresence>
          {searchExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute inset-x-0 top-0 bg-white z-50 shadow-sm border-b border-slate-100"
            >
              <div className="max-w-[800px] mx-auto px-5 py-3">
                <PulseSearch
                  signals={signals}
                  activeRole={activeRole}
                  onSelectSignal={(s) => { handleSelectSignal(s); setSearchExpanded(false); }}
                  onFullSearch={(q) => { handleFullSearch(q); setSearchExpanded(false); }}
                />
                <button
                  onClick={() => setSearchExpanded(false)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main className="pb-40">
        <AnimatePresence mode="wait">
          {isSearchActive ? (
            <motion.div
              key="search-results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="max-w-[800px] mx-auto px-5 py-6"
            >
              {/* Inline filters for search results */}
              <div className="mb-6">
                <InlineFilters filters={filters} onFiltersChange={setFilters} />
              </div>
              <SearchResultsView
                query={searchQuery}
                signals={signals}
                onClose={handleCloseSearch}
                onSelectSignal={handleSelectSignal}
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeRole}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Role-specific views handle their own layout constraints */}
              {activeRole === 'anouk' && <AnoukView />}
              {activeRole === 'rohan' && <RohanView />}
              {activeRole === 'sarah' && <SarahView />}
              {activeRole === 'jolanda' && <JolandaView />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Search-triggered detail drawer */}
      <PulseDetailDrawer signal={searchDrawerSignal} open={searchDrawerOpen} onOpenChange={setSearchDrawerOpen} />

      {/* ─── OMNI-DOCK: Persistent "One Door" Input ─── */}
      {/* Available for ALL users including Anouk */}
      <OmniDock />

      {/* ─── COMMAND PALETTE: ⌘K / Ctrl+K ─── */}
      <CommandPalette onSelectSignal={(id) => {
        const signal = signals.find(s => s.id === id);
        if (signal) handleSelectSignal(signal);
      }} />
    </div>
  );
};

const IndexWithProviders = () => {
  const { signals } = useRole();
  
  return (
    <SystemHealthProvider signals={signals}>
      <PulseApp />
    </SystemHealthProvider>
  );
};

const Index = () => (
  <RoleProvider>
    <IndexWithProviders />
  </RoleProvider>
);

export default Index;
