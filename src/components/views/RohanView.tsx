import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { useRole } from '@/context/RoleContext';
import { classifyAndGroup, ClassifiedSignal } from '@/lib/decisionTypes';
import PulseEditDrawer from '@/components/PulseEditDrawer';
import SuccessCheckmark from '@/components/SuccessCheckmark';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { 
  Check, MessageSquare, X, FileCheck2, ShieldAlert, Zap, 
  ArrowUpDown, CheckCheck, AlertTriangle, Clock, Pencil,
  Receipt, Image, Sparkles, Send, ChevronRight, Filter, Calendar, Euro,
  Brain, ArrowRight, CheckCircle2, DollarSign, Tag, FileText
} from 'lucide-react';
import { Signal } from '@/data/types';
import AICopilotOverlay from '@/components/AICopilotOverlay';
import AnomalyHeatmap from '@/components/AnomalyHeatmap';
import OrchestrationFlow from '@/components/OrchestrationFlow';
import AutoResolveStack from '@/components/AutoResolveStack';

/* ─── Mock Data ─── */
const threeWayMatches = [
  { id: 'twm-1', supplier: 'Schoonmaak B.V.', po: 'PO-2024-0891', grn: 'GRN-0891', invoice: 'INV-44921', poAmount: 245.00, invoiceAmount: 245.00, status: 'matched' as const, variance: 0, vendorAvgVariance: 1.1, aiNote: '' },
  { id: 'twm-2', supplier: 'MedSupply NL', po: 'PO-2024-0887', grn: 'GRN-0887', invoice: 'INV-44918', poAmount: 189.50, invoiceAmount: 194.30, status: 'variance' as const, variance: 2.5, vendorAvgVariance: 2.2, aiNote: 'price increase of €4.80 — likely freight surcharge' },
  { id: 'twm-3', supplier: 'Albert Heijn', po: null, grn: null, invoice: 'INV-44920', poAmount: 0, invoiceAmount: 67.40, status: 'missing-po' as const, variance: 0, vendorAvgVariance: 0.8, aiNote: 'suggest retroactive PO — matches recurring grocery pattern' },
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

type ThreeWayMatch = typeof threeWayMatches[number];

type SortMode = 'amount' | 'risk' | 'deadline' | 'vendor';

/* ─── GL Code Map ─── */
const glCodeMap: Record<string, string> = {
  purchase: '4900',
  maintenance: '4300',
  incident: '4500',
  compliance: '4600',
  event: '4700',
  resource: '4800',
  general: '4900',
  'shift-handover': '4100',
};

/* ─── Helper Functions ─── */
const computeVAT = (total: number, rate = 0.21) => {
  const net = total / (1 + rate);
  const vat = total - net;
  return { net, vat, total, rate };
};

const deriveCostCenter = (location: string, funding: string | null) => {
  return `${location}-${funding || 'General'}`;
};

const deriveBudgetPeriod = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const q = Math.ceil((d.getMonth() + 1) / 3);
    return `Q${q} ${d.getFullYear()}`;
  } catch {
    return 'Q1 2026';
  }
};

interface ComplianceCheck {
  label: string;
  description: string;
  passed: boolean;
}

const getComplianceChecks = (signal: ClassifiedSignal): ComplianceCheck[] => {
  const hasFlag = !!signal.flag_reason;
  const hasHighConfidence = (signal.confidence || 0) >= 70;
  const hasFunding = !!signal.funding;
  const hasAttachments = signal.attachments && signal.attachments.length > 0;

  return [
    {
      label: 'Policy match',
      description: hasFlag ? 'Above limit — manual review' : 'Within policy',
      passed: !hasFlag,
    },
    {
      label: 'Historical match',
      description: `${signal.confidence || 0}% similarity`,
      passed: hasHighConfidence,
    },
    {
      label: 'Funding verified',
      description: signal.funding || 'Unverified',
      passed: hasFunding,
    },
    {
      label: 'Receipt attached',
      description: hasAttachments ? 'Attached' : 'Missing',
      passed: !!hasAttachments,
    },
  ];
};

const formatDrawerDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
};

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
  const vatInfo = computeVAT(signal.amount || 0);
  const complianceChecks = getComplianceChecks(signal);
  const passedCount = complianceChecks.filter(c => c.passed).length;
  const glCode = glCodeMap[signal.signal_type] || '4900';
  const confidencePercent = signal.confidence || 0;
  const confidenceColor = confidencePercent >= 70 ? 'bg-signal-green' : confidencePercent >= 40 ? 'bg-signal-amber' : 'bg-signal-red';

  return (
    <div className="flex flex-col h-full">
      {/* Header: signal number + type + checks badge */}
      <div className="p-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">#{signal.signal_number}</span>
            <Badge variant="outline" className="text-[11px] capitalize">{signal.signal_type}</Badge>
          </div>
          <Badge
            variant="outline"
            className={`text-[11px] ${passedCount <= 1 ? 'border-signal-red text-signal-red' : passedCount <= 2 ? 'border-signal-amber text-signal-amber' : 'border-signal-green text-signal-green'}`}
          >
            {passedCount}/{complianceChecks.length} checks
          </Badge>
        </div>
        <h3 className="text-lg font-bold leading-snug">{signal.title || signal.description}</h3>
      </div>

      {/* Submitter info */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-muted-foreground shrink-0">
          {signal.submitter_name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold">{signal.submitter_name}</p>
          <p className="text-xs text-muted-foreground">
            {signal.location} · {formatDrawerDate(signal.created_at)}
          </p>
        </div>
      </div>

      {/* Description line */}
      {signal.description && (
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {signal.description} — submitted by {signal.submitter_name}
          </p>
        </div>
      )}

      {/* Financial summary card */}
      <div className="px-4 py-4 border-b border-border">
        <div className="rounded-xl bg-secondary/40 p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Total (incl. VAT)</p>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold tabular-nums">€{vatInfo.total.toFixed(2)}</p>
            <div className="text-right">
              <p className="text-xs text-muted-foreground tabular-nums">Net €{vatInfo.net.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground tabular-nums">VAT €{vatInfo.vat.toFixed(2)} (21%)</p>
            </div>
          </div>
          {/* Category tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline" className="text-[11px] gap-1">
              <Sparkles className="h-3 w-3" /> {glCode} — {signal.category || 'General'}
            </Badge>
            <Badge variant="outline" className="text-[11px] capitalize">{signal.category || 'General'}</Badge>
            <Badge variant="outline" className="text-[11px]">{signal.category || 'General'} / {signal.signal_type === 'general' ? 'Unclassified' : signal.signal_type}</Badge>
          </div>
        </div>
      </div>

      {/* Financial details grid */}
      <div className="px-4 py-4 border-b border-border">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">Financial Details</p>
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="grid grid-cols-2">
            <div className="p-3 border-b border-r border-border">
              <p className="text-[11px] text-muted-foreground mb-0.5">Cost Center</p>
              <p className="text-sm font-semibold">{deriveCostCenter(signal.location, signal.funding)}</p>
            </div>
            <div className="p-3 border-b border-border">
              <p className="text-[11px] text-muted-foreground mb-0.5">Budget Period</p>
              <p className="text-sm font-semibold">{deriveBudgetPeriod(signal.created_at)}</p>
            </div>
            <div className="p-3 border-r border-border">
              <p className="text-[11px] text-muted-foreground mb-0.5">Payment Terms</p>
              <p className="text-sm font-semibold">Immediate</p>
            </div>
            <div className="p-3">
              <p className="text-[11px] text-muted-foreground mb-0.5">Funding Stream</p>
              <p className="text-sm font-semibold">{signal.funding || 'General'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Confidence bar */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> AI Confidence
          </p>
          <p className="text-sm font-bold tabular-nums">{confidencePercent}%</p>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${confidenceColor}`}
            style={{ width: `${confidencePercent}%` }}
          />
        </div>
      </div>

      {/* AI Reasoning */}
      {signal.ai_reasoning && (
        <div className="px-4 py-4 border-b border-border">
          <div className="rounded-xl bg-secondary/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-muted-foreground" />
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">AI Reasoning</p>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{signal.ai_reasoning}</p>
          </div>
        </div>
      )}

      {/* Compliance section */}
      <div className="px-4 py-4 border-b border-border">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">Compliance</p>
        <div className="grid grid-cols-2 gap-3">
          {complianceChecks.map((check, i) => (
            <div key={i} className="flex items-start gap-2">
              {check.passed ? (
                <CheckCircle2 className="h-4 w-4 text-signal-green shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-signal-amber shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-medium leading-tight">{check.label}</p>
                <p className="text-xs text-muted-foreground">{check.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warning banner */}
      {signal.flag_reason && (
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 rounded-lg bg-signal-amber-bg/50 px-3 py-2.5">
            <AlertTriangle className="h-4 w-4 text-signal-amber shrink-0" />
            <p className="text-sm text-signal-amber font-medium">{signal.flag_reason}</p>
          </div>
        </div>
      )}

      {/* Receipt image placeholder */}
      <div className="px-4 py-4 border-b border-border">
        <div className="rounded-xl border-2 border-dashed border-border py-6 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <DollarSign className="h-7 w-7 mx-auto mb-1.5 opacity-40" />
            <p className="text-xs">Receipt image</p>
          </div>
        </div>
      </div>

      {/* Actions — sticky at bottom */}
      <div className="mt-auto p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <Button className="flex-1 gap-1.5" size="sm">
            <Check className="h-3.5 w-3.5" /> Approve
          </Button>
          <Button variant="outline" className="gap-1.5" size="sm" onClick={onQuery}>
            <MessageSquare className="h-3.5 w-3.5" /> Ask
          </Button>
          <Button variant="outline" className="gap-1.5" size="sm" onClick={onEdit}>
            <ArrowRight className="h-3.5 w-3.5" /> Reassign
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive px-2.5">
            <X className="h-4 w-4" />
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

/* ─── Three-Way Match Card (Monitoring Tab) ─── */
const matchCardStatusConfig = {
  variance: {
    border: 'border-signal-amber/40',
    badgeBg: 'bg-signal-amber-bg',
    badgeText: 'text-signal-amber',
  },
  'missing-po': {
    border: 'border-signal-red/40',
    badgeBg: 'bg-signal-red-bg',
    badgeText: 'text-signal-red',
  },
};

const ThreeWayMatchCard = ({
  match,
  isReconcileOpen,
  onReconcile,
  onClose,
  onApplyFix,
}: {
  match: ThreeWayMatch;
  isReconcileOpen: boolean;
  onReconcile: () => void;
  onClose: () => void;
  onApplyFix: () => void;
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const config = matchCardStatusConfig[match.status as 'variance' | 'missing-po'];
  const badgeLabel = match.status === 'variance'
    ? `${match.variance}% variance`
    : 'Missing PO';

  // Compute AI fix preview values
  const fixPreview = match.status === 'missing-po'
    ? { po: 'PO-2024-0901', grn: 'GRN-5531', amount: null }
    : { po: null, grn: null, amount: match.invoiceAmount };

  const handleClose = () => {
    setShowConfirm(false);
    onClose();
  };

  return (
    <div className="space-y-0">
      {/* Main match card */}
      <div className={cn(
        'rounded-xl bg-card p-3 border transition-shadow',
        config.border,
        isReconcileOpen ? 'rounded-b-none border-b-0 shadow-elevation-low' : 'shadow-elevation-low'
      )}>
        {/* Header: supplier + badge + reconcile */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">{match.supplier}</h3>
          <div className="flex items-center gap-1.5">
            <Badge className={cn('gap-1 border-0 text-[10px]', config.badgeBg, config.badgeText)}>
              <FileText className="h-2.5 w-2.5" />
              {badgeLabel}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 h-7 text-xs px-2"
              onClick={onReconcile}
            >
              <Sparkles className="h-3 w-3" /> Reconcile
            </Button>
          </div>
        </div>

        {/* PO / GRN / Invoice grid */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          {[
            { label: 'PO', value: match.po },
            { label: 'GRN', value: match.grn },
            { label: 'Invoice', value: match.invoice },
          ].map(doc => (
            <div
              key={doc.label}
              className="rounded-lg bg-slate-50 py-1.5 px-2.5 text-center"
            >
              <p className="text-[10px] text-muted-foreground mb-0.5">{doc.label}</p>
              <p className="font-semibold text-xs">{doc.value ?? '—'}</p>
            </div>
          ))}
        </div>

        {/* AI insight */}
        {match.aiNote && (
          <p className="text-xs text-signal-amber flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 shrink-0" />
            <span>AI: {match.aiNote}</span>
          </p>
        )}
      </div>

      {/* Inline reconciliation panel */}
      <AnimatePresence>
        {isReconcileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={cn(
              'rounded-b-xl bg-card p-3 border border-t-0 shadow-elevation-low',
              config.border
            )}>
              {/* Title bar */}
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  Reconciliation — {match.supplier}
                </h4>
                <button
                  onClick={handleClose}
                  className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>

              {/* PO / GRN / Amount detail grid */}
              <div className="grid grid-cols-3 gap-2 mb-2.5">
                {/* PO cell */}
                <div className={cn(
                  'rounded-lg py-1.5 px-2.5',
                  showConfirm && fixPreview.po
                    ? 'bg-hero-teal-soft border border-hero-teal/20'
                    : !match.po ? 'bg-signal-red-bg border border-signal-red/20' : 'bg-slate-50'
                )}>
                  <p className={cn(
                    'text-[10px] mb-0.5 flex items-center gap-1',
                    showConfirm && fixPreview.po
                      ? 'text-hero-teal font-medium'
                      : !match.po ? 'text-signal-red font-medium' : 'text-muted-foreground'
                  )}>
                    PO {!match.po && !showConfirm && <AlertTriangle className="h-2.5 w-2.5" />}
                    {showConfirm && fixPreview.po && <Check className="h-2.5 w-2.5" />}
                  </p>
                  {showConfirm && fixPreview.po ? (
                    <div>
                      {match.po && <p className="text-[10px] text-muted-foreground line-through">{match.po}</p>}
                      {!match.po && <p className="text-[10px] text-muted-foreground line-through">Missing</p>}
                      <p className="font-semibold text-xs text-hero-teal">{fixPreview.po}</p>
                    </div>
                  ) : (
                    <p className={cn(
                      'font-semibold text-xs',
                      !match.po && 'text-signal-red'
                    )}>
                      {match.po ?? 'Missing'}
                    </p>
                  )}
                </div>

                {/* GRN cell */}
                <div className={cn(
                  'rounded-lg py-1.5 px-2.5',
                  showConfirm && fixPreview.grn
                    ? 'bg-hero-teal-soft border border-hero-teal/20'
                    : !match.grn ? 'bg-signal-amber-bg border border-signal-amber/20' : 'bg-slate-50'
                )}>
                  <p className={cn(
                    'text-[10px] mb-0.5',
                    showConfirm && fixPreview.grn
                      ? 'text-hero-teal font-medium flex items-center gap-1'
                      : !match.grn ? 'text-signal-amber font-medium' : 'text-muted-foreground'
                  )}>
                    GRN {showConfirm && fixPreview.grn && <Check className="h-2.5 w-2.5" />}
                  </p>
                  {showConfirm && fixPreview.grn ? (
                    <div>
                      {match.grn && <p className="text-[10px] text-muted-foreground line-through">{match.grn}</p>}
                      {!match.grn && <p className="text-[10px] text-muted-foreground line-through">Missing</p>}
                      <p className="font-semibold text-xs text-hero-teal">{fixPreview.grn}</p>
                    </div>
                  ) : (
                    <p className={cn(
                      'font-semibold text-xs',
                      !match.grn && 'text-signal-amber'
                    )}>
                      {match.grn ?? 'Missing'}
                    </p>
                  )}
                </div>

                {/* Amount cell */}
                <div className={cn(
                  'rounded-lg py-1.5 px-2.5',
                  showConfirm && fixPreview.amount
                    ? 'bg-hero-teal-soft border border-hero-teal/20'
                    : 'bg-slate-50'
                )}>
                  <p className={cn(
                    'text-[10px] mb-0.5',
                    showConfirm && fixPreview.amount
                      ? 'text-hero-teal font-medium flex items-center gap-1'
                      : 'text-muted-foreground'
                  )}>
                    Amount {showConfirm && fixPreview.amount && <Check className="h-2.5 w-2.5" />}
                  </p>
                  {showConfirm && fixPreview.amount ? (
                    <div>
                      <p className="text-[10px] text-muted-foreground line-through">€{match.poAmount.toFixed(2)}</p>
                      <p className="font-semibold text-xs text-hero-teal">€{fixPreview.amount.toFixed(2)}</p>
                    </div>
                  ) : (
                    <p className="font-semibold text-xs">€{match.invoiceAmount.toFixed(2)}</p>
                  )}
                </div>
              </div>

              {/* AI suggestion bar / Confirm bar */}
              {showConfirm ? (
                <div className="flex items-center justify-between rounded-lg bg-hero-teal-soft p-2.5 mb-2.5">
                  <p className="text-xs text-hero-teal flex items-center gap-1.5 font-medium">
                    <Sparkles className="h-3 w-3 shrink-0" />
                    AI fix previewed — review changes above
                  </p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-2"
                      onClick={() => setShowConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1 h-7 text-xs px-2.5 bg-hero-teal text-white hover:bg-hero-teal/90"
                      onClick={onApplyFix}
                    >
                      <Check className="h-3 w-3" /> Confirm fix
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 mb-2.5">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-signal-amber shrink-0" />
                    <span>{match.status === 'missing-po'
                      ? 'Matches recurring grocery pattern'
                      : `Price increase of €${(match.invoiceAmount - match.poAmount).toFixed(2)} — likely freight surcharge`
                    }</span>
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 h-7 text-xs px-2 shrink-0"
                    onClick={() => setShowConfirm(true)}
                  >
                    <Sparkles className="h-3 w-3" /> Apply AI fix
                  </Button>
                </div>
              )}

              {/* Edit fields button */}
              <Button
                size="sm"
                className="gap-1 h-7 text-xs bg-foreground text-background hover:bg-foreground/90"
              >
                <Pencil className="h-3 w-3" /> Edit fields
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Reconcile Detail Content ─── */
const ReconcileDetailContent = ({
  match,
  onReconcile,
}: {
  match: ThreeWayMatch;
  onReconcile: () => void;
}) => {
  const isVariance = match.status === 'variance';
  const isMissingPO = match.status === 'missing-po';
  const varianceAmount = match.invoiceAmount - match.poAmount;
  const variancePct = match.poAmount > 0 ? ((varianceAmount / match.poAmount) * 100).toFixed(1) : '—';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-[11px]">Three-way match</Badge>
          <Badge
            variant="outline"
            className={`text-[11px] ${isVariance ? 'border-signal-amber text-signal-amber' : isMissingPO ? 'border-signal-red text-signal-red' : 'border-signal-green text-signal-green'}`}
          >
            {isVariance ? 'Variance detected' : isMissingPO ? 'Missing PO' : 'Matched'}
          </Badge>
        </div>
        <h3 className="text-lg font-bold leading-snug">{match.supplier}</h3>
        <p className="text-xs text-muted-foreground mt-1">Invoice {match.invoice}</p>
      </div>

      {/* Amount comparison */}
      <div className="px-4 py-4 border-b border-border">
        <div className="rounded-xl bg-secondary/40 p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Amount Comparison</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">PO Amount</span>
              <span className="text-sm font-semibold tabular-nums">
                {match.poAmount > 0 ? `€${match.poAmount.toFixed(2)}` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Invoice Amount</span>
              <span className="text-sm font-bold tabular-nums">€{match.invoiceAmount.toFixed(2)}</span>
            </div>
            {isVariance && (
              <>
                <div className="border-t border-border" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-signal-amber">Variance</span>
                  <span className="text-sm font-bold tabular-nums text-signal-amber">
                    +€{varianceAmount.toFixed(2)} ({variancePct}%)
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Match details grid */}
      <div className="px-4 py-4 border-b border-border">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">Match Details</p>
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="grid grid-cols-2">
            <div className="p-3 border-b border-r border-border">
              <p className="text-[11px] text-muted-foreground mb-0.5">PO Number</p>
              <p className="text-sm font-semibold">{match.po || '—'}</p>
            </div>
            <div className="p-3 border-b border-border">
              <p className="text-[11px] text-muted-foreground mb-0.5">GRN Number</p>
              <p className="text-sm font-semibold">{match.grn || '—'}</p>
            </div>
            <div className="p-3 border-r border-border">
              <p className="text-[11px] text-muted-foreground mb-0.5">Invoice Number</p>
              <p className="text-sm font-semibold">{match.invoice}</p>
            </div>
            <div className="p-3">
              <p className="text-[11px] text-muted-foreground mb-0.5">Vendor Avg Variance</p>
              <p className="text-sm font-semibold">{match.vendorAvgVariance}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status checks */}
      <div className="px-4 py-4 border-b border-border">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">Verification</p>
        <div className="grid grid-cols-1 gap-2.5">
          <div className="flex items-start gap-2">
            {match.po ? (
              <CheckCircle2 className="h-4 w-4 text-signal-green shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-signal-red shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-medium">Purchase Order</p>
              <p className="text-xs text-muted-foreground">{match.po ? `${match.po} — verified` : 'No PO found for this invoice'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            {match.grn ? (
              <CheckCircle2 className="h-4 w-4 text-signal-green shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-signal-red shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-medium">Goods Receipt</p>
              <p className="text-xs text-muted-foreground">{match.grn ? `${match.grn} — received` : 'No goods receipt note'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-signal-green shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Invoice</p>
              <p className="text-xs text-muted-foreground">{match.invoice} — €{match.invoiceAmount.toFixed(2)}</p>
            </div>
          </div>
          {isVariance && (
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-signal-amber shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Amount Match</p>
                <p className="text-xs text-muted-foreground">+{match.variance}% variance — vendor avg is {match.vendorAvgVariance}%</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Warning banner */}
      {(isVariance || isMissingPO) && (
        <div className="px-4 py-3 border-b border-border">
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 ${isMissingPO ? 'bg-signal-red-bg/50' : 'bg-signal-amber-bg/50'}`}>
            <AlertTriangle className={`h-4 w-4 shrink-0 ${isMissingPO ? 'text-signal-red' : 'text-signal-amber'}`} />
            <p className={`text-sm font-medium ${isMissingPO ? 'text-signal-red' : 'text-signal-amber'}`}>
              {isMissingPO 
                ? 'No purchase order found — requires manual matching or PO creation'
                : `Invoice exceeds PO by ${match.variance}% — review before posting to GL`}
            </p>
          </div>
        </div>
      )}

      {/* Actions — sticky at bottom */}
      <div className="mt-auto p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <Button className="flex-1 gap-1.5" size="sm" onClick={onReconcile}>
            <Check className="h-3.5 w-3.5" /> Reconcile
          </Button>
          <Button variant="outline" className="gap-1.5" size="sm">
            <MessageSquare className="h-3.5 w-3.5" /> Query Supplier
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive px-2.5">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const RohanView = () => {
  const { signals } = useRole();
  const [sortMode, setSortMode] = useState<SortMode>('risk');
  const [selectedSignal, setSelectedSignal] = useState<ClassifiedSignal | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<ThreeWayMatch | null>(null);
  const [editSignal, setEditSignal] = useState<Signal | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'exceptions' | 'approvals' | 'monitoring'>('exceptions');
  const [reconciledIds, setReconciledIds] = useState<Set<string>>(new Set());
  const [appliedFixes, setAppliedFixes] = useState<Set<string>>(new Set());
  const [resolvedLowRisk, setResolvedLowRisk] = useState(false);
  const [showSuccessCheck, setShowSuccessCheck] = useState(false);
  const [reconcileOpenId, setReconcileOpenId] = useState<string | null>(null);
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
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left sidebar — Heatmap + Auto-resolved */}
          <div className="lg:col-span-1 space-y-4">
            <AnomalyHeatmap onLocationClick={(loc) => console.log('Navigate to', loc)} />
            <AutoResolveStack autoDemo={true} />
          </div>

          {/* Main feed area */}
          <div className="lg:col-span-3 space-y-4">
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
                  <div
                    key={match.id}
                    onClick={() => { setSelectedMatch(match); setSelectedSignal(null); }}
                    className={`w-full text-left p-4 rounded-xl transition-all cursor-pointer ${
                      selectedMatch?.id === match.id
                        ? 'bg-card shadow-elevation-medium ring-2 ring-foreground/10'
                        : 'bg-card/50 hover:bg-card hover:shadow-elevation-low'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <ConfidenceFlag level={match.status === 'missing-po' ? 'low' : 'medium'} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{match.supplier}</p>
                        <p className="text-xs text-muted-foreground">
                          {match.invoice} · {match.status === 'variance' ? `+${match.variance}% variance` : 'Missing PO'}
                        </p>
                      </div>
                      <p className="text-sm font-bold tabular-nums">€{match.invoiceAmount.toFixed(2)}</p>
                      <Button
                        size="sm"
                        className="gap-1.5 shrink-0"
                        onClick={(e) => { e.stopPropagation(); handleReconcile(match); }}
                      >
                        <Check className="h-3.5 w-3.5" /> Reconcile
                      </Button>
                      <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${selectedMatch?.id === match.id ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                ))}
                
                {/* Signal exceptions */}
                {sortItems(filterItems(exceptions)).map(signal => (
                  <ExceptionRow
                    key={signal.id}
                    signal={signal}
                    onSelect={() => { setSelectedSignal(signal); setSelectedMatch(null); }}
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
                    onSelect={() => { setSelectedSignal(signal); setSelectedMatch(null); }}
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

                {/* Three-Way Match cards */}
                {actionableMatches.filter(m => !reconciledIds.has(m.id)).length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-signal-amber" />
                      <h3 className="text-sm font-semibold">Three-Way Match</h3>
                      <Badge variant="outline" className="text-[10px] bg-signal-amber-bg text-signal-amber border-0">
                        {actionableMatches.filter(m => !reconciledIds.has(m.id)).length} pending
                      </Badge>
                    </div>
                    <AnimatePresence mode="popLayout">
                      {actionableMatches.filter(m => !reconciledIds.has(m.id)).map(match => (
                        <ThreeWayMatchCard
                          key={match.id}
                          match={match}
                          isReconcileOpen={reconcileOpenId === match.id}
                          onReconcile={() => setReconcileOpenId(match.id)}
                          onClose={() => setReconcileOpenId(null)}
                          onApplyFix={() => {
                            handleReconcile(match);
                            setReconcileOpenId(null);
                          }}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}

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
      </div>

      {/* Detail Drawer — slides in from right */}
      <Sheet
        open={!!selectedSignal || !!selectedMatch}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSignal(null);
            setSelectedMatch(null);
          }
        }}
      >
        <SheetContent side="right" className="w-[600px] sm:w-[680px] p-0 overflow-y-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>
              {selectedSignal ? (selectedSignal.title || selectedSignal.description) : selectedMatch?.supplier}
            </SheetTitle>
          </SheetHeader>
          {selectedSignal && (
            <DetailDrawerContent
              signal={selectedSignal}
              onEdit={() => openEdit(selectedSignal)}
              onQuery={() => {}}
            />
          )}
          {selectedMatch && (
            <ReconcileDetailContent
              match={selectedMatch}
              onReconcile={() => {
                handleReconcile(selectedMatch);
                setSelectedMatch(null);
              }}
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
