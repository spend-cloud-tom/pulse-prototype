import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { useRole } from '@/context/RoleContext';
import { classifyAndGroup, ClassifiedSignal } from '@/lib/decisionTypes';
import PulseDetailDrawer from '@/components/PulseDetailDrawer';
import PulseEditDrawer from '@/components/PulseEditDrawer';
import SuccessCheckmark from '@/components/SuccessCheckmark';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { 
  Check, MessageSquare, X, FileCheck2, ShieldAlert, Zap, 
  ArrowUpDown, CheckCheck, AlertTriangle, Clock, Pencil,
  Receipt, Image, Sparkles, Send, ChevronRight, Filter, Calendar, Euro
} from 'lucide-react';
import { Signal } from '@/data/types';
import AICopilotOverlay from '@/components/AICopilotOverlay';

/* ─── Mock Data ─── */
const threeWayMatches = [
  { id: 'twm-1', supplier: 'Schoonmaak B.V.', po: 'PO-2024-0891', grn: 'GRN-0891', invoice: 'INV-44921', poAmount: 245.00, invoiceAmount: 245.00, status: 'matched' as const, variance: 0, vendorAvgVariance: 1.1 },
  { id: 'twm-2', supplier: 'MedSupply NL', po: 'PO-2024-0887', grn: 'GRN-0887', invoice: 'INV-44918', poAmount: 189.50, invoiceAmount: 194.30, status: 'variance' as const, variance: 2.5, vendorAvgVariance: 2.2 },
  { id: 'twm-3', supplier: 'Albert Heijn', po: null, grn: null, invoice: 'INV-44920', poAmount: 0, invoiceAmount: 67.40, status: 'missing-po' as const, variance: 0, vendorAvgVariance: 0.8 },
];

const shadowSpendItems = [
  { category: 'Non-contracted suppliers', amount: 1240, count: 8, trend: '+23%', risk: 'high' as const },
  { category: 'Personal card purchases', amount: 560, count: 12, trend: '+5%', risk: 'medium' as const },
  { category: 'Duplicate payments', amount: 89, count: 1, trend: '0%', risk: 'low' as const },
];

const missingDataFixes = [
  { pulse: 'Groceries — Zonneweide', field: 'GL code', suggestion: '4210 — Food & Beverages', confidence: 94 },
  { pulse: 'Bus tickets — De Berk', field: 'VAT rate', suggestion: '9% — Transport', confidence: 91 },
  { pulse: 'Medical supplies', field: 'Receipt', suggestion: 'Reminder sent to Anouk', confidence: 0 },
];

type SortMode = 'amount' | 'risk' | 'deadline' | 'vendor';

/* ─── Confidence Flag Component ─── */
const ConfidenceFlag = ({ level }: { level: 'high' | 'medium' | 'low' }) => {
  const config = {
    high: { label: 'High', className: 'confidence-high', dot: '🟢' },
    medium: { label: 'Review', className: 'confidence-review', dot: '🟡' },
    low: { label: 'Query', className: 'confidence-query', dot: '🔴' },
  };
  const c = config[level];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${c.className}`}>
      <span>{c.dot}</span> {c.label}
    </span>
  );
};

/* ─── Exception Row for Desktop ─── */
const ExceptionRow = ({ 
  signal, 
  onSelect, 
  isSelected 
}: { 
  signal: ClassifiedSignal; 
  onSelect: () => void;
  isSelected: boolean;
}) => {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl transition-all ${
        isSelected 
          ? 'bg-card shadow-elevation-medium ring-2 ring-foreground/10' 
          : 'bg-card/50 hover:bg-card hover:shadow-elevation-low'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Confidence flag */}
        <ConfidenceFlag level={signal.riskLevel} />
        
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{signal.description}</p>
          <p className="text-xs text-muted-foreground">
            {signal.submitter_name} · {signal.location}
          </p>
        </div>
        
        {/* Amount */}
        <div className="text-right shrink-0">
          <p className="text-sm font-bold tabular-nums">
            €{(signal.amount || 0).toFixed(2)}
          </p>
          {signal.ai_reasoning && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
              <Sparkles className="h-2.5 w-2.5" /> AI flagged
            </p>
          )}
        </div>
        
        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isSelected ? 'rotate-90' : ''}`} />
      </div>
    </button>
  );
};

/* ─── Detail Drawer Content ─── */
const DetailDrawerContent = ({ 
  signal, 
  onEdit,
  onQuery
}: { 
  signal: ClassifiedSignal;
  onEdit: () => void;
  onQuery: () => void;
}) => {
  const [queryMessage, setQueryMessage] = useState('');

  return (
    <div className="flex flex-col h-full">
      {/* Receipt image placeholder */}
      <div className="p-4 border-b border-border">
        <div className="aspect-[4/3] rounded-xl bg-secondary/50 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">Receipt image</p>
          </div>
        </div>
      </div>
      
      {/* AI Reasoning */}
      {signal.ai_reasoning && (
        <div className="p-4 border-b border-border bg-hero-purple-soft/30">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-hero-purple" />
            <p className="text-xs font-semibold text-hero-purple uppercase tracking-wider">AI Analysis</p>
          </div>
          <p className="text-sm leading-relaxed">{signal.ai_reasoning}</p>
          {signal.flag_reason && (
            <Badge className="mt-2 text-[10px] bg-signal-amber-bg text-signal-amber border-0">
              {signal.flag_reason}
            </Badge>
          )}
        </div>
      )}
      
      {/* Details grid */}
      <div className="p-4 border-b border-border">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Amount</p>
            <p className="font-semibold tabular-nums">€{(signal.amount || 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Category</p>
            <p className="font-medium">{signal.category || 'Uncategorized'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Funding</p>
            <p className="font-medium">{signal.funding || 'TBD'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Type</p>
            <p className="font-medium capitalize">{signal.signal_type}</p>
          </div>
        </div>
      </div>
      
      {/* Quick chat to query */}
      <div className="p-4 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Quick query to {signal.submitter_name.split(' ')[0]}
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={queryMessage}
            onChange={(e) => setQueryMessage(e.target.value)}
            placeholder="Ask about this expense..."
            className="flex-1 text-sm px-3 py-2 rounded-lg bg-secondary/50 border-0 focus:ring-2 focus:ring-foreground/10 outline-none"
          />
          <Button size="sm" variant="outline" className="shrink-0">
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      
      {/* Actions — sticky at bottom */}
      <div className="mt-auto p-4 space-y-2 border-t border-border bg-card">
        <div className="flex gap-2">
          <Button className="flex-1 gap-1.5" size="sm">
            <Check className="h-3.5 w-3.5" /> Approve
          </Button>
          <Button variant="outline" className="flex-1 gap-1.5" size="sm" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-1.5" size="sm" onClick={onQuery}>
            <MessageSquare className="h-3.5 w-3.5" /> Query
          </Button>
          <Button variant="ghost" className="flex-1 gap-1.5 text-destructive hover:text-destructive" size="sm">
            <X className="h-3.5 w-3.5" /> Reject
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Rohan View ─── */
type FilterState = {
  riskLevel: 'all' | 'high' | 'medium' | 'low';
  amountRange: 'all' | 'under50' | '50to200' | 'over200';
  dateRange: 'all' | 'today' | 'week' | 'month';
};

const RohanView = () => {
  const { signals } = useRole();
  const [sortMode, setSortMode] = useState<SortMode>('risk');
  const [selectedSignal, setSelectedSignal] = useState<ClassifiedSignal | null>(null);
  const [editSignal, setEditSignal] = useState<Signal | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'exceptions' | 'approvals' | 'monitoring'>('exceptions');
  const [reconciledIds, setReconciledIds] = useState<Set<string>>(new Set());
  const [appliedFixes, setAppliedFixes] = useState<Set<string>>(new Set());
  const [resolvedLowRisk, setResolvedLowRisk] = useState(false);
  const [showSuccessCheck, setShowSuccessCheck] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    riskLevel: 'all',
    amountRange: 'all',
    dateRange: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);

  const actionPulses = signals.filter(s => s.status === 'pending' || s.status === 'needs-clarity');
  const completedPulses = signals.filter(s => s.status === 'delivered' || s.status === 'closed' || s.status === 'auto-approved');

  const { approvals, exceptions, alerts } = useMemo(() => classifyAndGroup(actionPulses), [actionPulses]);
  const allItems = [...exceptions, ...approvals, ...alerts];
  
  // Handle reconciling a 3-way match with success animation
  const handleReconcile = (match: typeof threeWayMatches[0]) => {
    // Show success checkmark animation
    setShowSuccessCheck(true);
    setTimeout(() => setShowSuccessCheck(false), 800);
    
    setReconciledIds(prev => new Set([...prev, match.id]));
    toast({
      title: "✅ Reconciled — posting to GL",
      description: `${match.supplier} invoice ${match.invoice} matched to ${match.po}. Posting to GL 4210.`,
    });
    setTimeout(() => {
      toast({
        title: "📊 GL Updated",
        description: `Transaction posted. Budget impact: -€${match.invoiceAmount.toFixed(2)} from Hygiene & Cleaning.`,
      });
    }, 2000);
  };
  
  // Handle applying an auto-fix
  const handleApplyFix = (fix: typeof missingDataFixes[0]) => {
    setAppliedFixes(prev => new Set([...prev, fix.pulse]));
    toast({
      title: "✅ Auto-fix applied",
      description: `${fix.field} set to "${fix.suggestion}" for ${fix.pulse}.`,
    });
  };
  
  // Handle bulk resolve low-risk items
  const handleResolveLowRisk = (count: number) => {
    setResolvedLowRisk(true);
    toast({
      title: "✅ Bulk resolved",
      description: `${count} low-risk exceptions auto-approved and posted to GL.`,
    });
    setTimeout(() => {
      toast({
        title: "📧 Audit trail created",
        description: "All transactions logged with AI confidence scores for compliance.",
      });
    }, 1500);
  };

  const sortItems = (items: ClassifiedSignal[]) => {
    return [...items].sort((a, b) => {
      switch (sortMode) {
        case 'amount': return (b.amount || 0) - (a.amount || 0);
        case 'risk': {
          const riskOrder = { high: 0, medium: 1, low: 2 };
          return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
        }
        case 'vendor': return (a.supplier_suggestion || a.submitter_name).localeCompare(b.supplier_suggestion || b.submitter_name);
        case 'deadline': return (a.expected_date || 'z').localeCompare(b.expected_date || 'z');
        default: return 0;
      }
    });
  };

  const totalExposure = actionPulses.reduce((sum, s) => sum + (s.amount || 0), 0);
  const highRiskCount = allItems.filter(s => s.riskLevel === 'high').length;
  const actionableMatches = threeWayMatches.filter(m => m.status !== 'matched');
  const matchedCount = threeWayMatches.filter(m => m.status === 'matched').length;
  const lowRiskExceptions = actionableMatches.filter(m => m.variance > 0 && m.variance < 3);

  // Filter items based on current filter state
  const filterItems = (items: ClassifiedSignal[]) => {
    return items.filter(item => {
      // Risk level filter
      if (filters.riskLevel !== 'all' && item.riskLevel !== filters.riskLevel) return false;
      
      // Amount range filter
      const amount = item.amount || 0;
      if (filters.amountRange === 'under50' && amount >= 50) return false;
      if (filters.amountRange === '50to200' && (amount < 50 || amount > 200)) return false;
      if (filters.amountRange === 'over200' && amount <= 200) return false;
      
      return true;
    });
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== 'all').length;

  const openEdit = (signal: Signal) => {
    setEditSignal(signal);
    setEditOpen(true);
  };

  return (
    <div className="min-h-screen">
      {/* Sovereign header — full width, data-dense */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight">
                €{totalExposure.toLocaleString('nl-NL', { minimumFractionDigits: 0 })}
                <span className="text-lg font-normal text-muted-foreground ml-2">exposure</span>
              </h1>
              <div className="flex items-center gap-4 mt-1 text-sm">
                {highRiskCount > 0 && (
                  <span className="flex items-center gap-1.5 text-signal-red font-medium">
                    🔴 {highRiskCount} high priority
                  </span>
                )}
                <span className="text-muted-foreground">{exceptions.length} exceptions</span>
                <span className="text-muted-foreground">{approvals.length} approvals</span>
                <span className="text-muted-foreground">{matchedCount} auto-matched</span>
              </div>
            </div>
            
            {/* Bulk actions */}
            {lowRiskExceptions.length > 0 && !resolvedLowRisk && (
              <Button 
                className="gap-2 shadow-elevation-low"
                onClick={() => handleResolveLowRisk(lowRiskExceptions.length)}
              >
                <CheckCheck className="h-4 w-4" />
                Resolve {lowRiskExceptions.length} low-risk
              </Button>
            )}
          </div>
          
          {/* Tab navigation */}
          <div className="flex items-center gap-1 mt-4 border-b border-border -mb-px">
            {[
              { key: 'exceptions', label: 'Exceptions', count: exceptions.length + actionableMatches.length },
              { key: 'approvals', label: 'Approvals', count: approvals.length },
              { key: 'monitoring', label: 'Monitoring', count: shadowSpendItems.length },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key 
                    ? 'border-foreground text-foreground' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
                <span className="ml-2 text-xs bg-secondary px-1.5 py-0.5 rounded-full">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="space-y-4">
            {/* Sort & Filter controls */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Sort by</span>
                {(['risk', 'amount', 'deadline', 'vendor'] as SortMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setSortMode(mode)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors capitalize ${
                      sortMode === mode 
                        ? 'bg-foreground text-background font-medium' 
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    showFilters || activeFilterCount > 0
                      ? 'bg-foreground text-background font-medium'
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                  }`}
                >
                  <Filter className="h-3.5 w-3.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="bg-background text-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => setCopilotOpen(true)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <span>📊</span> AI triage
                </button>
              </div>
            </div>
            
            {/* Filter panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-xl bg-card border border-border space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Filters</h3>
                      {activeFilterCount > 0 && (
                        <button
                          onClick={() => setFilters({ riskLevel: 'all', amountRange: 'all', dateRange: 'all' })}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      {/* Risk Level */}
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" /> Risk Level
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { value: 'all', label: 'All' },
                            { value: 'high', label: '🔴 High' },
                            { value: 'medium', label: '🟡 Medium' },
                            { value: 'low', label: '🟢 Low' },
                          ].map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => setFilters(f => ({ ...f, riskLevel: opt.value as any }))}
                              className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                                filters.riskLevel === opt.value
                                  ? 'bg-foreground text-background font-medium'
                                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Amount Range */}
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                          <Euro className="h-3.5 w-3.5" /> Amount
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { value: 'all', label: 'All' },
                            { value: 'under50', label: '< €50' },
                            { value: '50to200', label: '€50-200' },
                            { value: 'over200', label: '> €200' },
                          ].map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => setFilters(f => ({ ...f, amountRange: opt.value as any }))}
                              className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                                filters.amountRange === opt.value
                                  ? 'bg-foreground text-background font-medium'
                                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Date Range */}
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" /> Date
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { value: 'all', label: 'All' },
                            { value: 'today', label: 'Today' },
                            { value: 'week', label: 'This week' },
                            { value: 'month', label: 'This month' },
                          ].map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => setFilters(f => ({ ...f, dateRange: opt.value as any }))}
                              className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                                filters.dateRange === opt.value
                                  ? 'bg-foreground text-background font-medium'
                                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Exception list */}
            {activeTab === 'exceptions' && (
              <div className="space-y-2">
                {/* Three-way match exceptions */}
                {actionableMatches.filter(m => !reconciledIds.has(m.id)).map(match => (
                  <div key={match.id} className="p-4 rounded-xl bg-card shadow-elevation-low">
                    <div className="flex items-center gap-4">
                      <ConfidenceFlag level={match.status === 'missing-po' ? 'low' : 'medium'} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{match.supplier}</p>
                        <p className="text-xs text-muted-foreground">
                          {match.invoice} · {match.status === 'variance' ? `+${match.variance}% variance` : 'Missing PO'}
                        </p>
                      </div>
                      <p className="text-sm font-bold tabular-nums">€{match.invoiceAmount.toFixed(2)}</p>
                      <Button 
                        size="sm" 
                        className="gap-1.5"
                        onClick={() => handleReconcile(match)}
                      >
                        <Check className="h-3.5 w-3.5" /> Reconcile
                      </Button>
                    </div>
                  </div>
                ))}
                
                {/* Signal exceptions */}
                {sortItems(filterItems(exceptions)).map(signal => (
                  <ExceptionRow
                    key={signal.id}
                    signal={signal}
                    onSelect={() => setSelectedSignal(signal)}
                    isSelected={selectedSignal?.id === signal.id}
                  />
                ))}
                
                {/* Empty state when filters hide all items */}
                {filterItems(exceptions).length === 0 && exceptions.length > 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No items match your filters</p>
                    <button
                      onClick={() => setFilters({ riskLevel: 'all', amountRange: 'all', dateRange: 'all' })}
                      className="text-xs text-foreground underline mt-1"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Approvals list */}
            {activeTab === 'approvals' && (
              <div className="space-y-2">
                {sortItems(filterItems(approvals)).map(signal => (
                  <ExceptionRow
                    key={signal.id}
                    signal={signal}
                    onSelect={() => setSelectedSignal(signal)}
                    isSelected={selectedSignal?.id === signal.id}
                  />
                ))}
                
                {/* Empty state when filters hide all items */}
                {filterItems(approvals).length === 0 && approvals.length > 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No items match your filters</p>
                    <button
                      onClick={() => setFilters({ riskLevel: 'all', amountRange: 'all', dateRange: 'all' })}
                      className="text-xs text-foreground underline mt-1"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Monitoring tab */}
            {activeTab === 'monitoring' && (
              <div className="space-y-6">
                {/* Shadow spend */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-signal-amber" />
                    <h3 className="text-sm font-semibold">Shadow Spend</h3>
                  </div>
                  {shadowSpendItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-card shadow-elevation-low">
                      <div>
                        <p className="text-sm font-semibold">{item.category}</p>
                        <p className="text-xs text-muted-foreground">{item.count} transactions · {item.trend}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold tabular-nums">€{item.amount.toLocaleString()}</p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-1"
                          onClick={() => toast({
                            title: "📊 Shadow Spend Review",
                            description: `Opening ${item.category} transactions for review...`,
                          })}
                        >Review</Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Auto-fix suggestions */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-hero-teal" />
                    <h3 className="text-sm font-semibold">Auto-fix Suggestions</h3>
                  </div>
                  {missingDataFixes.filter(f => !appliedFixes.has(f.pulse)).map((fix, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-card shadow-elevation-low">
                      <div>
                        <p className="text-sm font-semibold">{fix.pulse}</p>
                        <p className="text-xs text-muted-foreground">
                          Missing: {fix.field}
                          {fix.confidence > 0 && <span> · {fix.suggestion} ({fix.confidence}%)</span>}
                        </p>
                      </div>
                      {fix.confidence > 0 && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="gap-1.5"
                          onClick={() => handleApplyFix(fix)}
                        >
                          <Check className="h-3.5 w-3.5" /> Apply
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Auto-matched */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="h-4 w-4 text-signal-green" />
                    <h3 className="text-sm font-semibold">Auto-matched</h3>
                    <Badge variant="outline" className="text-[10px] bg-signal-green-bg text-signal-green border-0">
                      {matchedCount} OK
                    </Badge>
                  </div>
                  {threeWayMatches.filter(m => m.status === 'matched').map(match => (
                    <div key={match.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                      <div>
                        <p className="text-sm font-medium">{match.supplier}</p>
                        <p className="text-xs text-muted-foreground">{match.po} · {match.invoice}</p>
                      </div>
                      <p className="text-sm tabular-nums">€{match.invoiceAmount.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Detail Drawer — slides in from right */}
      <Sheet open={!!selectedSignal} onOpenChange={(open) => !open && setSelectedSignal(null)}>
        <SheetContent side="right" className="w-[420px] sm:w-[480px] p-0 overflow-y-auto">
          <SheetHeader className="p-4 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-2 mb-1">
              {selectedSignal && <ConfidenceFlag level={selectedSignal.riskLevel} />}
            </div>
            <SheetTitle className="text-base font-semibold">
              {selectedSignal?.description}
            </SheetTitle>
            <p className="text-sm text-muted-foreground">
              {selectedSignal?.submitter_name} · {selectedSignal?.location}
            </p>
          </SheetHeader>
          {selectedSignal && (
            <DetailDrawerContent
              signal={selectedSignal}
              onEdit={() => openEdit(selectedSignal)}
              onQuery={() => {}}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Edit drawer */}
      <PulseEditDrawer signal={editSignal} open={editOpen} onOpenChange={setEditOpen} />
      
      {/* AI Co-pilot */}
      <AICopilotOverlay open={copilotOpen} onClose={() => setCopilotOpen(false)} role="rohan" />
      
      {/* Success checkmark animation overlay */}
      <AnimatePresence>
        <SuccessCheckmark show={showSuccessCheck} />
      </AnimatePresence>
    </div>
  );
};

export default RohanView;
