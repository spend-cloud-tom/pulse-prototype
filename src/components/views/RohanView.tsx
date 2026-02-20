import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { useRole } from '@/context/RoleContext';
import { classifyAndGroup, ClassifiedSignal } from '@/lib/decisionTypes';
import PulseEditDrawer from '@/components/PulseEditDrawer';
import SuccessCheckmark from '@/components/SuccessCheckmark';
import ImageThumbnail from '@/components/ImageThumbnail';
import PulseTypeTag from '@/components/PulseTypeTag';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { 
  Check, MessageSquare, X, Filter,
  ArrowUpDown, CheckCheck, AlertTriangle, Clock,
  Sparkles, Send, ChevronRight, Zap, ShieldAlert, FileCheck2, FileText, Pencil,
  Brain, CheckCircle2, TrendingUp, Users, FileWarning, Euro
} from 'lucide-react';
import { Signal } from '@/data/types';
import { demoImages } from '@/data/mockData';
import AICopilotOverlay from '@/components/AICopilotOverlay';
import { pulseActions } from '@/lib/pulseActions';

/* ═══════════════════════════════════════════════════════════════════════════
   ROHAN VIEW — Finance Pulse Pipeline (Organizer-Workspace Pattern)
   
   UX Principles Applied:
   - Organizer-Workspace Pattern (About Face): Split-screen with persistent sidebar
   - Kill Navigational Excise: No page changes, modeless detail panel
   - Data Density: Condensed KPI row, high-density list
   - Visual Hierarchy: Soft tags, clear selected state
   - Everything is a Pulse: Finance Pulses, Reconciliation Pulses
   ═══════════════════════════════════════════════════════════════════════════ */

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
const getSignalImage = (signal: Signal): string => {
  const type = signal.signal_type;
  const title = (signal.title || '').toLowerCase();
  const desc = (signal.description || '').toLowerCase();
  
  if (type === 'purchase' || title.includes('groceries') || title.includes('supplies')) return demoImages.receipt;
  if (type === 'maintenance') {
    if (title.includes('light') || title.includes('bulb') || title.includes('lamp')) return demoImages.brokenLightbulb;
    if (title.includes('wheelchair') || title.includes('chair')) return demoImages.brokenWheelchair;
    if (title.includes('shower') || desc.includes('shower')) return demoImages.brokenShower;
    if (title.includes('leak') || title.includes('faucet') || title.includes('tap')) return demoImages.leakyFaucet;
    if (title.includes('flood')) return demoImages.flood;
    return demoImages.leakyFaucet;
  }
  if (type === 'incident' || title.includes('fall') || title.includes('incident') || desc.includes('fall')) return demoImages.fallIncident;
  if (type === 'compliance') return demoImages.medication;
  if (title.includes('invoice')) return demoImages.invoice;
  if (title.includes('delivery') || title.includes('package')) return demoImages.deliveryConfirm;
  return demoImages.receipt;
};

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

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
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

/* ─── Confidence Tag Component (Soft, Low-Contrast per Refactoring UI) ─── */
const ConfidenceTag = ({ level }: { level: 'high' | 'medium' | 'low' }) => {
  const config = {
    high: { 
      label: 'Spot-check', 
      bg: 'bg-emerald-50', 
      text: 'text-emerald-700',
      dot: '🟢' 
    },
    medium: { 
      label: 'Review', 
      bg: 'bg-amber-50', 
      text: 'text-amber-700',
      dot: '🟡' 
    },
    low: { 
      label: 'Query', 
      bg: 'bg-state-risk-bg', 
      text: 'text-state-risk',
      dot: '🔴' 
    },
  };
  const c = config[level];
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap',
      c.bg, c.text
    )}>
      <span className="text-[10px]">{c.dot}</span> {c.label}
    </span>
  );
};

/* ─── Dense List Row (Organizer-Workspace Pattern) ─── */
const ExceptionListRow = ({ 
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
      className={cn(
        'w-full text-left px-4 py-2.5 transition-all border-l-4',
        isSelected 
          ? 'bg-slate-100 border-l-teal-600' 
          : 'bg-white hover:bg-slate-50 border-l-transparent'
      )}
    >
      {/* Table-like grid with fixed columns for clean vertical alignment */}
      <div className="grid grid-cols-[70px_70px_1fr_80px] sm:grid-cols-[90px_80px_1fr_100px_100px] items-center gap-2 min-w-0">
        {/* Col 1: Confidence tag - fixed width */}
        <div className="flex justify-start">
          <ConfidenceTag level={signal.riskLevel} />
        </div>
        
        {/* Col 2: Amount - right aligned, tabular, neutral styling */}
        <p className="text-sm tabular-nums text-slate-500 text-right">
          €{(signal.amount || 0).toFixed(2)}
        </p>
        
        {/* Col 3: Vendor/Description - flexible, left aligned */}
        <p className="text-sm font-medium text-slate-900 truncate text-left">
          {signal.supplier_suggestion || signal.title || signal.description}
        </p>
        
        {/* Col 4: Date/Invoice - right aligned */}
        <p className="text-xs text-slate-400 text-right">
          {formatDate(signal.created_at)}
        </p>
        
        {/* Col 5: Submitter - right aligned, hidden on small screens */}
        <p className="text-xs text-slate-400 truncate text-right hidden sm:block">
          {signal.submitter_name}
        </p>
      </div>
    </button>
  );
};

/* ─── Detail Sidebar Content (Modeless, Persistent) ─── */
const DetailSidebar = ({ 
  signal, 
  onApprove,
  onReject,
  onAskQuestion
}: { 
  signal: ClassifiedSignal;
  onApprove: () => void;
  onReject: () => void;
  onAskQuestion: (question: string) => void;
}) => {
  const [chatInput, setChatInput] = useState('');
  const vatInfo = computeVAT(signal.amount || 0);
  const complianceChecks = getComplianceChecks(signal);
  const passedCount = complianceChecks.filter(c => c.passed).length;
  const glCode = glCodeMap[signal.signal_type] || '4900';

  const handleSendQuestion = () => {
    if (chatInput.trim()) {
      onAskQuestion(chatInput);
      setChatInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Scrollable content area (image + details scroll together) */}
      <div className="flex-1 overflow-y-auto">
        {/* TOP: Receipt Image */}
        <div className="relative h-64 bg-slate-100 overflow-hidden shrink-0">
          <img 
            src={getSignalImage(signal)} 
            alt="Receipt" 
            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
            onClick={() => {
              toast({
                title: "📷 Full image view",
                description: "Opening receipt in full screen...",
              });
            }}
          />
          <div className="absolute top-3 left-3">
            <ConfidenceTag level={signal.riskLevel} />
          </div>
          <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <p className="text-white text-lg tabular-nums drop-shadow-sm">
              €{vatInfo.total.toFixed(2)}
            </p>
            <p className="text-white/80 text-xs drop-shadow-sm">
              {signal.submitter_name}
            </p>
          </div>
        </div>
        {/* Header info */}
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900 leading-snug">
            {signal.supplier_suggestion || signal.title || signal.description}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            #{signal.signal_number} · {signal.location} · {formatDrawerDate(signal.created_at)}
          </p>
        </div>

        {/* MIDDLE: AI Reasoning Panel — visually distinct */}
        <div className="mx-4 my-4 rounded-lg bg-slate-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-slate-400" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">AI Reasoning</p>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            {signal.ai_reasoning || `Coded as ${glCode} because ${signal.submitter_name} submitted from ${signal.location}. ${signal.funding ? `Funding: ${signal.funding}.` : ''}`}
          </p>
          {/* Compliance mini-checks */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-200">
            {complianceChecks.slice(0, 3).map((check, i) => (
              <div key={i} className="flex items-center gap-1">
                {check.passed ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                )}
                <span className="text-xs text-slate-500">{check.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial details - compact */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-400">Cost Center</p>
              <p className="font-medium text-slate-700">{deriveCostCenter(signal.location, signal.funding)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">GL Code</p>
              <p className="font-medium text-slate-700">{glCode}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Net / VAT</p>
              <p className="font-medium text-slate-700 tabular-nums">€{vatInfo.net.toFixed(2)} / €{vatInfo.vat.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Funding</p>
              <p className="font-medium text-slate-700">{signal.funding || 'General'}</p>
            </div>
          </div>
        </div>

        {/* Warning banner if flagged */}
        {signal.flag_reason && (
          <div className="mx-4 mb-4">
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2.5 border border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-700">{signal.flag_reason}</p>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM: Actions — Chat-first hierarchy when AI is uncertain */}
      <div className="border-t border-slate-200 bg-white p-4 pb-36 sm:pb-40 space-y-3">
        {/* PRIMARY: Inline chat input to ask care worker (top position = primary action) */}
        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendQuestion()}
            placeholder={`Ask ${signal.submitter_name} a question...`}
            className="flex-1 px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm"
                  className="gap-1.5 bg-teal-600 hover:bg-teal-700 px-4"
                  onClick={handleSendQuestion}
                  disabled={!chatInput.trim()}
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send question to {signal.submitter_name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* SECONDARY: Warm, inviting action buttons */}
        <div className="flex items-center gap-3 pt-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="warm"
                  className="flex-1 gap-1.5 rounded-xl" 
                  size="sm"
                  onClick={onApprove}
                >
                  <Check className="h-3.5 w-3.5" /> Approve
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Approve expense and post to General Ledger</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="text-sm text-slate-400 hover:text-destructive px-2"
                  onClick={onReject}
                >
                  Reject
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reject and notify {signal.submitter_name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

/* ─── Match Sidebar Content (for Three-Way Match items) ─── */
const MatchSidebar = ({ 
  match,
  onReconcile,
  onAskQuestion
}: { 
  match: ThreeWayMatch;
  onReconcile: () => void;
  onAskQuestion: (question: string) => void;
}) => {
  const [chatInput, setChatInput] = useState('');
  const isVariance = match.status === 'variance';
  const isMissingPO = match.status === 'missing-po';

  const handleSendQuestion = () => {
    if (chatInput.trim()) {
      onAskQuestion(chatInput);
      setChatInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Scrollable content area (image + details scroll together) */}
      <div className="flex-1 overflow-y-auto">
        {/* TOP: Invoice/Receipt Image */}
        <div className="relative h-64 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
          <img 
            src={demoImages.invoice} 
            alt="Invoice" 
            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
            onClick={() => {
              toast({
                title: "📄 Full invoice view",
                description: "Opening invoice in full screen...",
              });
            }}
          />
          <div className="absolute top-3 left-3">
            <ConfidenceTag level={isMissingPO ? 'low' : 'medium'} />
          </div>
          <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <p className="text-white text-lg tabular-nums drop-shadow-sm">
              €{match.invoiceAmount.toFixed(2)}
            </p>
            <p className="text-white/80 text-xs drop-shadow-sm">
              {match.invoice}
            </p>
          </div>
        </div>
        {/* Header info */}
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900 leading-snug">
            {match.supplier}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {match.invoice} · {isVariance ? `+${match.variance}% variance` : isMissingPO ? 'Missing PO' : 'Matched'}
          </p>
        </div>

        {/* AI Reasoning Panel */}
        <div className="mx-4 my-4 rounded-lg bg-slate-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-slate-400" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">AI Reasoning</p>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            {match.aiNote || (isVariance 
              ? `Invoice amount €${match.invoiceAmount.toFixed(2)} differs from PO amount €${match.poAmount.toFixed(2)} by ${match.variance}%. This vendor's average variance is ${match.vendorAvgVariance}%.`
              : `No purchase order found for this invoice. Recommend creating retroactive PO or rejecting.`
            )}
          </p>
          {/* Three-way match status */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-200">
            <div className="flex items-center gap-1">
              {match.po ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              )}
              <span className="text-xs text-slate-500">PO</span>
            </div>
            <div className="flex items-center gap-1">
              {match.grn ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              )}
              <span className="text-xs text-slate-500">GRN</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs text-slate-500">Invoice</span>
            </div>
          </div>
        </div>

        {/* Document details */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-400">Purchase Order</p>
              <p className="font-medium text-slate-700">{match.po || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Goods Receipt</p>
              <p className="font-medium text-slate-700">{match.grn || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">PO Amount</p>
              <p className="font-medium text-slate-700 tabular-nums">{match.poAmount ? `€${match.poAmount.toFixed(2)}` : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Invoice Amount</p>
              <p className="font-medium text-slate-700 tabular-nums">€{match.invoiceAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Warning banner */}
        {(isVariance || isMissingPO) && (
          <div className="mx-4 mb-4">
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2.5 border border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-700">
                {isVariance 
                  ? `Price variance of ${match.variance}% detected. Review before reconciling.`
                  : 'No matching PO found. Create retroactive PO or reject invoice.'
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM: Actions */}
      <div className="border-t border-slate-200 bg-white p-4 pb-36 sm:pb-40 space-y-3">
        {/* Chat input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendQuestion()}
            placeholder="Ask a question about this invoice..."
            className="flex-1 px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm"
                  className="gap-1.5 bg-teal-600 hover:bg-teal-700 px-4"
                  onClick={handleSendQuestion}
                  disabled={!chatInput.trim()}
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send question to procurement</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Action buttons — warm, inviting style */}
        <div className="flex items-center gap-3 pt-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="warm"
                  className="flex-1 gap-1.5 rounded-xl" 
                  size="sm"
                  onClick={onReconcile}
                >
                  <Check className="h-3.5 w-3.5" /> Reconcile
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Accept variance and post to GL</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="text-sm text-slate-400 hover:text-destructive px-2"
                  onClick={() => {
                    toast({
                      title: "❌ Invoice rejected",
                      description: `${match.invoice} has been rejected and returned to ${match.supplier}.`,
                    });
                  }}
                >
                  Reject
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reject invoice and notify supplier</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

/* ─── Legacy Detail Drawer Content (for Sheet fallback) ─── */
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
  const confidenceColor = confidencePercent >= 70 ? 'bg-signal-green' : confidencePercent >= 40 ? 'bg-state-blocked' : 'bg-state-risk';

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
            className={`text-[11px] ${passedCount <= 1 ? 'border-state-risk text-state-risk' : passedCount <= 2 ? 'border-state-blocked text-state-blocked' : 'border-signal-green text-signal-green'}`}
          >
            {passedCount}/{complianceChecks.length} checks
          </Badge>
        </div>
        <h3 className="text-lg font-semibold leading-snug">{signal.title || signal.description}</h3>
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

      {/* AI Reasoning - prominent */}
      <div className="mx-4 my-4 rounded-lg bg-slate-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-4 w-4 text-slate-400" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">AI Reasoning</p>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          {signal.ai_reasoning || `Coded as ${glCode} because ${signal.submitter_name} submitted from ${signal.location}.`}
        </p>
      </div>

      {/* Financial summary card */}
      <div className="px-4 py-4 border-b border-border">
        <div className="rounded-xl bg-secondary/40 p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Total (incl. VAT)</p>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl text-muted-foreground tabular-nums">€{vatInfo.total.toFixed(2)}</p>
            <div className="text-right">
              <p className="text-xs text-muted-foreground tabular-nums">Net €{vatInfo.net.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground tabular-nums">VAT €{vatInfo.vat.toFixed(2)} (21%)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Signal image — constrained cover with tap-to-expand */}
      <div className="px-4 py-4 border-b border-border">
        <ImageThumbnail src={getSignalImage(signal)} alt="Attachment" size="lg" />
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
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive px-2.5" onClick={onEdit}>
            <X className="h-4 w-4" />
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
    border: 'border-state-blocked/40',
    badgeBg: 'bg-state-blocked-bg',
    badgeText: 'text-state-blocked',
  },
  'missing-po': {
    border: 'border-state-risk/40',
    badgeBg: 'bg-state-risk-bg',
    badgeText: 'text-state-risk',
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
          <p className="text-xs text-state-blocked flex items-center gap-1.5">
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
                    : !match.po ? 'bg-state-risk-bg border border-state-risk/20' : 'bg-slate-50'
                )}>
                  <p className={cn(
                    'text-[10px] mb-0.5 flex items-center gap-1',
                    showConfirm && fixPreview.po
                      ? 'text-hero-teal font-medium'
                      : !match.po ? 'text-state-risk font-medium' : 'text-muted-foreground'
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
                      !match.po && 'text-state-risk'
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
                    : !match.grn ? 'bg-state-blocked-bg border border-state-blocked/20' : 'bg-slate-50'
                )}>
                  <p className={cn(
                    'text-[10px] mb-0.5',
                    showConfirm && fixPreview.grn
                      ? 'text-hero-teal font-medium flex items-center gap-1'
                      : !match.grn ? 'text-state-blocked font-medium' : 'text-muted-foreground'
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
                      !match.grn && 'text-state-blocked'
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
                    <Sparkles className="h-3 w-3 text-state-blocked shrink-0" />
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
            className={`text-[11px] ${isVariance ? 'border-state-blocked text-state-blocked' : isMissingPO ? 'border-state-risk text-state-risk' : 'border-signal-green text-signal-green'}`}
          >
            {isVariance ? 'Variance detected' : isMissingPO ? 'Missing PO' : 'Matched'}
          </Badge>
        </div>
        <h3 className="text-lg font-semibold leading-snug">{match.supplier}</h3>
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
              <span className="text-sm text-muted-foreground tabular-nums">€{match.invoiceAmount.toFixed(2)}</span>
            </div>
            {isVariance && (
              <>
                <div className="border-t border-border" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-state-blocked">Variance</span>
                  <span className="text-sm tabular-nums text-state-blocked">
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
              <AlertTriangle className="h-4 w-4 text-state-risk shrink-0 mt-0.5" />
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
              <AlertTriangle className="h-4 w-4 text-state-risk shrink-0 mt-0.5" />
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
              <AlertTriangle className="h-4 w-4 text-state-blocked shrink-0 mt-0.5" />
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
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 ${isMissingPO ? 'bg-state-risk-bg/50' : 'bg-state-blocked-bg/50'}`}>
            <AlertTriangle className={`h-4 w-4 shrink-0 ${isMissingPO ? 'text-state-risk' : 'text-state-blocked'}`} />
            <p className={`text-sm font-medium ${isMissingPO ? 'text-state-risk' : 'text-state-blocked'}`}>
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
      description: `${match.supplier} invoice ${match.invoice} matched.`,
    });
    setTimeout(() => {
      toast({
        title: "📊 Posted",
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
      title: "✅ Bulk Resolved",
      description: `${count} low-risk items auto-approved and posted to GL.`,
    });
    setTimeout(() => {
      toast({
        title: "📧 Audit trail created",
        description: "All items logged with AI confidence scores for compliance.",
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

  const handleApprove = (signal: ClassifiedSignal) => {
    toast({
      title: "✅ Approved",
      description: `${signal.title || signal.description} approved. Posting to GL.`,
    });
    setSelectedSignal(null);
  };

  const handleReject = (signal: ClassifiedSignal) => {
    toast({
      title: "❌ Rejected",
      description: `${signal.title || signal.description} rejected. ${signal.submitter_name} notified.`,
    });
    setSelectedSignal(null);
  };

  const handleAskQuestion = (signal: ClassifiedSignal, question: string) => {
    toast({
      title: "💬 Question sent",
      description: `Message sent to ${signal.submitter_name}: "${question.slice(0, 40)}${question.length > 40 ? '...' : ''}"`,
    });
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col">
      <div className="max-w-[1400px] mx-auto w-full flex flex-col flex-1 min-h-0">
      {/* ═══ HEADER: Page Title + Condensed KPI Row ═══ */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-6 py-4">
          {/* Title row */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display text-2xl font-bold text-slate-900">
              Finance <span className="text-slate-400 font-normal">· Your Flow</span>
            </h1>
            {lowRiskExceptions.length > 0 && !resolvedLowRisk && (
              <Button 
                className="gap-2"
                onClick={() => handleResolveLowRisk(lowRiskExceptions.length)}
              >
                <CheckCheck className="h-4 w-4" />
                Bulk Approve {lowRiskExceptions.length} Low-Risk
              </Button>
            )}
          </div>
          
          {/* ═══ CONDENSED KPI ROW (Replaces Heatmap Column) ═══ */}
          <div className="grid grid-cols-4 gap-4">
            {/* Total Exposure */}
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Euro className="h-4 w-4 text-slate-400" />
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Exposure</p>
              </div>
              <p className="text-2xl text-muted-foreground tabular-nums">
                €{totalExposure.toLocaleString('nl-NL', { minimumFractionDigits: 0 })}
              </p>
            </div>
            
            {/* Exceptions to Review */}
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <FileWarning className="h-4 w-4 text-amber-500" />
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Exceptions</p>
              </div>
              <p className="text-2xl text-muted-foreground tabular-nums">
                {exceptions.length + actionableMatches.length}
                <span className="text-sm font-normal text-muted-foreground ml-1">to review</span>
              </p>
            </div>
            
            {/* Spot-Checks Pending */}
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-emerald-500" />
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Spot-Checks</p>
              </div>
              <p className="text-2xl text-muted-foreground tabular-nums">
                {approvals.length}
                <span className="text-sm font-normal text-muted-foreground ml-1">pending</span>
              </p>
            </div>
            
            {/* Auto-Handled */}
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Auto-Handled</p>
              </div>
              <p className="text-2xl text-muted-foreground tabular-nums">
                {matchedCount}
                <span className="text-sm font-normal text-muted-foreground ml-1">this week</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ ORGANIZER-WORKSPACE LAYOUT (60/40 Split) ═══ */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* ─── INDEX PANE (Left, ~60%) ─── */}
        <div className="w-[60%] flex flex-col border-r border-slate-200 bg-white overflow-hidden min-h-0">
          {/* Tab navigation */}
          <div className="flex items-center gap-1 px-4 pt-3 border-b border-slate-200">
            {[
              { key: 'exceptions', label: 'Needs Action', count: exceptions.length + actionableMatches.length },
              { key: 'approvals', label: 'In Motion', count: approvals.length },
              { key: 'monitoring', label: 'Monitoring', count: 0 },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab.key 
                    ? 'border-slate-900 text-slate-900' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          {/* Sort controls */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
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
            
          </div>
          
          {/* Scrollable list area */}
          <div className="flex-1 overflow-y-auto">
            {/* Exception list */}
            {activeTab === 'exceptions' && (
              <div className="space-y-2">
                {/* Three-way match exceptions — uniform row style with table-like grid */}
                {actionableMatches.filter(m => !reconciledIds.has(m.id)).map(match => (
                  <button
                    key={match.id}
                    onClick={() => { setSelectedMatch(match); setSelectedSignal(null); }}
                    className={cn(
                      'w-full text-left px-4 py-2.5 transition-all border-l-4',
                      selectedMatch?.id === match.id
                        ? 'bg-slate-100 border-l-teal-600'
                        : 'bg-white hover:bg-slate-50 border-l-transparent'
                    )}
                  >
                    {/* Same grid as ExceptionListRow for vertical alignment */}
                    <div className="grid grid-cols-[70px_70px_1fr_80px] sm:grid-cols-[90px_80px_1fr_100px_100px] items-center gap-2 min-w-0">
                      <div className="flex justify-start">
                        <ConfidenceTag level={match.status === 'missing-po' ? 'low' : 'medium'} />
                      </div>
                      <p className="text-sm text-muted-foreground tabular-nums text-right">
                        €{match.invoiceAmount.toFixed(2)}
                      </p>
                      <p className="text-sm font-medium text-slate-900 truncate text-left">
                        {match.supplier}
                      </p>
                      <p className="text-xs text-slate-400 text-right">
                        {match.invoice}
                      </p>
                      <p className="text-xs text-slate-400 text-right hidden sm:block">
                        {match.status === 'variance' ? `+${match.variance}%` : 'No PO'}
                      </p>
                    </div>
                  </button>
                ))}
                
                {/* Signal exceptions */}
                {sortItems(filterItems(exceptions)).map(signal => (
                  <ExceptionListRow
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
                  <ExceptionListRow
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
              <div className="p-4 space-y-8">
                {/* Shadow spend */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-state-blocked" />
                    <h3 className="text-sm font-semibold">Shadow Spend</h3>
                  </div>
                  {shadowSpendItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-card shadow-elevation-low">
                      <div>
                        <p className="text-sm font-semibold">{item.category}</p>
                        <p className="text-xs text-muted-foreground">{item.count} transactions · {item.trend}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg text-muted-foreground tabular-nums">€{item.amount.toLocaleString()}</p>
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
                <div className="space-y-4">
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
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-state-blocked" />
                      <h3 className="text-sm font-semibold">Three-Way Match</h3>
                      <Badge variant="outline" className="text-[10px] bg-state-blocked-bg text-state-blocked border-0">
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
                <div className="space-y-4">
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
        
        {/* ─── DETAIL SIDEBAR (Right, ~40%) — Persistent, Modeless ─── */}
        <div className="w-[40%] bg-white border-l border-slate-200 flex flex-col overflow-hidden">
          {selectedSignal ? (
            <DetailSidebar
              signal={selectedSignal}
              onApprove={() => handleApprove(selectedSignal)}
              onReject={() => handleReject(selectedSignal)}
              onAskQuestion={(q) => handleAskQuestion(selectedSignal, q)}
            />
          ) : selectedMatch ? (
            <MatchSidebar
              match={selectedMatch}
              onReconcile={() => {
                handleReconcile(selectedMatch);
                setSelectedMatch(null);
              }}
              onAskQuestion={(q) => {
                toast({
                  title: "💬 Question sent",
                  description: `Message sent to procurement: "${q.slice(0, 40)}${q.length > 40 ? '...' : ''}"`,
                });
              }}
            />
          ) : (
            /* Empty state when nothing selected */
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <FileWarning className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-500">Select a Pulse to review</p>
                <p className="text-xs text-slate-400 mt-1">Click any row in the list to see details</p>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>{/* close max-w-[1400px] wrapper */}

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
