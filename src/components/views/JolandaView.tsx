import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRole } from '@/context/RoleContext';
import { locationBudgets, aiAlerts, signalTypeConfig } from '@/data/mockData';
import { groupByDecisionLayer, ClassifiedSignal, urgencyTierConfig } from '@/lib/decisionTypes';
import PulseDetailDrawer from '@/components/PulseDetailDrawer';
import SuccessCheckmark from '@/components/SuccessCheckmark';
import OrchestrationSummary from '@/components/OrchestrationSummary';
import BudgetRadar from '@/components/BudgetRadar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, MessageSquare, X, Sparkles, AlertTriangle, 
  ChevronRight, ChevronDown, Euro, ArrowUpRight, Send, HelpCircle,
  Activity, Shield, Info, User, MapPin, Clock
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import AICopilotOverlay from '@/components/AICopilotOverlay';
import AutoResolveStack from '@/components/AutoResolveStack';

const formatTimeAgo = (ts: string) => {
  try {
    const d = new Date(ts);
    const now = new Date();
    const diffMin = Math.round((now.getTime() - d.getTime()) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.round(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.round(diffH / 24);
    if (diffD === 1) return 'Yesterday';
    return `${diffD}d ago`;
  } catch { return ts; }
};

/* ─── LAYER 1: Judgment Card — Financial decisions requiring approval ─── */
const JudgmentCard = ({ 
  signal, 
  onSelect,
  onApprove,
  onEscalate,
  onRequestClarification,
  onReject
}: { 
  signal: ClassifiedSignal;
  onSelect: () => void;
  onApprove: () => void;
  onEscalate: () => void;
  onRequestClarification: () => void;
  onReject: () => void;
}) => {
  const tierConfig = urgencyTierConfig[signal.urgencyTier];
  const isCritical = signal.urgencyTier === 'critical';
  const typeConfig = signalTypeConfig[signal.signal_type] || signalTypeConfig.general;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      className={`rounded-2xl bg-card p-6 shadow-elevation-medium space-y-4 border-l-4 ${
        isCritical ? 'border-l-signal-red urgency-glow' : 
        signal.urgencyTier === 'high' ? 'border-l-signal-amber' : 'border-l-hero-teal'
      }`}
    >
      {/* Object type + urgency header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {typeConfig.objectName}
        </span>
        <div className="flex items-center gap-2">
          {isCritical && (
            <Badge className="text-[10px] bg-signal-red-bg text-signal-red border-0 shrink-0 animate-pulse">
              Critical
            </Badge>
          )}
          {signal.urgencyTier === 'high' && !isCritical && (
            <Badge className="text-[10px] bg-signal-amber-bg text-signal-amber border-0 shrink-0">
              High Priority
            </Badge>
          )}
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex items-start gap-4">
        <div className={`flex items-center justify-center h-12 w-12 rounded-xl shrink-0 ${tierConfig.bgColor}`}>
          <Euro className={`h-6 w-6 ${tierConfig.textColor}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-lg leading-tight">{signal.description}</p>
          {signal.flag_reason && (
            <p className="text-xs text-signal-amber mt-1">{signal.flag_reason}</p>
          )}
        </div>
        
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold tabular-nums">
            €{(signal.amount || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
      
      {/* Metadata footer — Creator, Location, Time */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          <span className="font-medium">{signal.submitter_name}</span>
        </span>
        <span>·</span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span>{signal.location}</span>
        </span>
        <span>·</span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{formatTimeAgo(signal.created_at)}</span>
        </span>
      </div>
      
      {/* AI Insight — inline, contextual */}
      {signal.ai_reasoning && (
        <div className="rounded-xl bg-hero-purple-soft/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-hero-purple" />
            <p className="text-xs font-semibold text-hero-purple uppercase tracking-wider">
              AI Insight
            </p>
          </div>
          <p className="text-sm leading-relaxed">{signal.ai_reasoning}</p>
        </div>
      )}
      
      {/* EXPLICIT CTAs — No ambiguous "Advance Pulse" */}
      <div className="flex items-center gap-2 pt-2">
        <Button onClick={onApprove} className="gap-1.5 flex-1 bg-signal-green hover:bg-signal-green/90">
          <Check className="h-4 w-4" /> Approve
        </Button>
        <Button variant="outline" onClick={onEscalate} className="gap-1.5">
          <ArrowUpRight className="h-4 w-4" /> Escalate
        </Button>
        <Button variant="outline" onClick={onRequestClarification} className="gap-1.5">
          <HelpCircle className="h-4 w-4" /> Clarify
        </Button>
        <Button variant="ghost" onClick={onReject} className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
};

/* ─── LAYER 2: Exception Card — Anomalies, compliance, patterns ─── */
const ExceptionCard = ({ 
  signal, 
  onReview,
  onDismiss
}: { 
  signal: ClassifiedSignal;
  onReview: () => void;
  onDismiss: () => void;
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-card p-4 shadow-elevation-low flex items-center gap-4"
    >
      <div className="flex items-center justify-center h-10 w-10 rounded-lg shrink-0 bg-signal-amber-bg">
        <AlertTriangle className="h-5 w-5 text-signal-amber" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{signal.description}</p>
        <p className="text-xs text-muted-foreground">
          {signal.flag_reason || 'Pattern detected'}
        </p>
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" variant="outline" onClick={onReview} className="h-8 text-xs">
          Review
        </Button>
        <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground p-1">
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};

/* ─── LAYER 3: Informational Item — Clinical handovers, awareness ─── */
const InformationalItem = ({ signal }: { signal: ClassifiedSignal }) => {
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-secondary/50 transition-colors">
      <Info className="h-4 w-4 text-muted-foreground shrink-0" />
      <p className="text-sm text-muted-foreground truncate flex-1">{signal.description}</p>
      <span className="text-xs text-muted-foreground shrink-0">{signal.submitter_name}</span>
    </div>
  );
};

/* ─── Main Jolanda View — DECISION COCKPIT ─── */
const JolandaView = () => {
  const { signals } = useRole();
  const [selectedSignal, setSelectedSignal] = useState<ClassifiedSignal | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [showSuccessCheck, setShowSuccessCheck] = useState(false);
  
  // Collapsible sections state
  const [exceptionsExpanded, setExceptionsExpanded] = useState(false);
  const [informationalExpanded, setInformationalExpanded] = useState(false);
  const [aiMetricsExpanded, setAiMetricsExpanded] = useState(false);

  // Filter for Zonneweide location and pending status
  const locationSignals = signals.filter(s => s.location === 'Zonneweide');
  const actionPulses = locationSignals.filter(
    s => s.status === 'pending' || s.status === 'needs-clarity'
  );

  // Use the new 3-layer grouping
  const layers = useMemo(() => groupByDecisionLayer(actionPulses), [actionPulses]);
  
  // Filter out handled items
  const judgmentPulses = layers.judgment.filter(s => !approvedIds.has(s.id) && !dismissedIds.has(s.id));
  const exceptionPulses = layers.exceptions.filter(s => !dismissedIds.has(s.id));
  const informationalPulses = layers.informational;

  // Progress and completed pulses for stats
  const progressPulses = locationSignals.filter(
    s => s.status === 'in-motion' || s.status === 'awaiting-supplier' || s.status === 'approved'
  );
  const completedPulses = locationSignals.filter(
    s => s.status === 'delivered' || s.status === 'closed' || s.status === 'auto-approved'
  );

  // Calculate financial exposure for judgment pulses only
  const totalFinancialExposure = judgmentPulses.reduce((sum, s) => sum + (s.amount || 0), 0);
  const criticalCount = judgmentPulses.filter(s => s.urgencyTier === 'critical').length;

  // Orchestration stats
  const totalPulses = locationSignals.length || 47;
  const autoHandled = completedPulses.length + progressPulses.length || 44;

  // === HANDLERS ===
  const handleApprove = (signal: ClassifiedSignal) => {
    setShowSuccessCheck(true);
    setTimeout(() => setShowSuccessCheck(false), 800);
    setApprovedIds(prev => new Set([...prev, signal.id]));
    toast({
      title: "✅ Approved",
      description: `€${(signal.amount || 0).toFixed(2)} — routed to procurement.`,
    });
    setTimeout(() => {
      toast({
        title: "📦 In motion",
        description: `Sarah is now processing this request.`,
      });
    }, 2500);
  };

  const handleEscalate = (signal: ClassifiedSignal) => {
    setApprovedIds(prev => new Set([...prev, signal.id]));
    toast({
      title: "⬆️ Escalated",
      description: `Sent to regional manager for review.`,
    });
  };

  const handleRequestClarification = (signal: ClassifiedSignal) => {
    setSelectedSignal(signal);
    setDrawerOpen(true);
  };

  const handleReject = (signal: ClassifiedSignal) => {
    setDismissedIds(prev => new Set([...prev, signal.id]));
    toast({
      title: "❌ Rejected",
      description: `${signal.submitter_name} will be notified.`,
    });
  };

  const handleDismissException = (signal: ClassifiedSignal) => {
    setDismissedIds(prev => new Set([...prev, signal.id]));
    toast({
      title: "Dismissed",
      description: "Exception acknowledged.",
    });
  };

  const openDrawer = (signal: ClassifiedSignal) => {
    setSelectedSignal(signal);
    setDrawerOpen(true);
  };

  return (
    <div className="min-h-screen">
      {/* ═══════════════════════════════════════════════════════════════════
          ORCHESTRATION SUMMARY — The key differentiator
          Shows: AI handled X%, Y decisions need you, Z€ exposure
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-6 pt-6">
        <OrchestrationSummary
          totalPulses={totalPulses}
          autoHandled={autoHandled}
          decisionsNeeded={judgmentPulses.length || 3}
          timeSavedMinutes={45}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          HEADER — Location + Financial Exposure Summary
          Answers: "What do I need to decide right now?"
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="border-b border-border bg-gradient-to-r from-hero-purple-soft/30 via-background to-hero-teal-soft/30 mt-6">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight">
                Decision Cockpit
              </h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-signal-red animate-pulse" />
                  <strong className="text-foreground">{judgmentPulses.length || 3}</strong> require your decision
                </span>
                <span className="text-border">·</span>
                <span className="flex items-center gap-1">
                  <Euro className="h-3.5 w-3.5" />
                  <strong className="text-foreground">{(totalFinancialExposure || 670).toLocaleString()}</strong> at risk
                </span>
                {criticalCount > 0 && (
                  <>
                    <span className="text-border">·</span>
                    <Badge className="text-[10px] bg-signal-red-bg text-signal-red border-0">
                      {criticalCount} critical
                    </Badge>
                  </>
                )}
              </p>
            </div>
            
            {/* Budget Radar — compact */}
            <div className="flex gap-4">
              {locationBudgets.slice(0, 2).map(loc => (
                <BudgetRadar
                  key={loc.location}
                  location={loc.location}
                  spent={loc.spent}
                  total={loc.total}
                  trend={loc.trend}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT — 3-Layer Decision Cockpit
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* ─────────────────────────────────────────────────────────────
              LEFT COLUMN: Decision Layers (2/3 width)
          ───────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* ═══ LAYER 1: HUMAN JUDGMENT REQUIRED ═══
                Dominant, max 3-5 visible, financial decisions only */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-signal-red-bg">
                  <Activity className="h-4 w-4 text-signal-red" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Requires Your Decision</h2>
                  <p className="text-xs text-muted-foreground">
                    Financial approvals above auto-limit
                  </p>
                </div>
                <Badge className="ml-auto text-sm bg-signal-red-bg text-signal-red border-0">
                  {judgmentPulses.length || 3}
                </Badge>
              </div>
              
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {judgmentPulses.slice(0, 5).map(signal => (
                    <JudgmentCard
                      key={signal.id}
                      signal={signal}
                      onSelect={() => openDrawer(signal)}
                      onApprove={() => handleApprove(signal)}
                      onEscalate={() => handleEscalate(signal)}
                      onRequestClarification={() => handleRequestClarification(signal)}
                      onReject={() => handleReject(signal)}
                    />
                  ))}
                </AnimatePresence>
                
                {judgmentPulses.length === 0 && (
                  <div className="rounded-2xl bg-signal-green-bg/50 p-8 text-center">
                    <Check className="h-8 w-8 text-signal-green mx-auto mb-3" />
                    <p className="font-semibold text-signal-green">All decisions made</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      No financial approvals pending
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* ═══ LAYER 2: EXCEPTIONS & RISK ALERTS ═══
                Collapsible by default, pattern anomalies */}
            {(exceptionPulses.length > 0 || aiAlerts.length > 0) && (
              <section>
                <button
                  onClick={() => setExceptionsExpanded(!exceptionsExpanded)}
                  className="flex items-center gap-3 w-full text-left mb-3 group"
                >
                  <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-signal-amber-bg">
                    <Shield className="h-3.5 w-3.5 text-signal-amber" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm group-hover:text-foreground transition-colors">
                      Exceptions & Alerts
                    </h3>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {exceptionPulses.length + aiAlerts.length}
                  </Badge>
                  {exceptionsExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                
                <AnimatePresence>
                  {exceptionsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-2"
                    >
                      {exceptionPulses.map(signal => (
                        <ExceptionCard
                          key={signal.id}
                          signal={signal}
                          onReview={() => openDrawer(signal)}
                          onDismiss={() => handleDismissException(signal)}
                        />
                      ))}
                      {aiAlerts.slice(0, 3).map(alert => (
                        <div 
                          key={alert.id}
                          className="rounded-xl bg-card p-4 shadow-elevation-low flex items-center gap-4"
                        >
                          <div className="flex items-center justify-center h-10 w-10 rounded-lg shrink-0 bg-signal-amber-bg">
                            <AlertTriangle className="h-5 w-5 text-signal-amber" />
                          </div>
                          <p className="text-sm flex-1">{alert.message}</p>
                          <Button size="sm" variant="outline" className="h-8 text-xs shrink-0">
                            Review
                          </Button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            )}

            {/* ═══ LAYER 3: INFORMATIONAL ═══
                Collapsed by default, clinical handovers, awareness-only */}
            {informationalPulses.length > 0 && (
              <section>
                <button
                  onClick={() => setInformationalExpanded(!informationalExpanded)}
                  className="flex items-center gap-3 w-full text-left mb-2 group"
                >
                  <div className="flex items-center justify-center h-6 w-6 rounded bg-secondary">
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    Informational ({informationalPulses.length})
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    Clinical handovers, awareness
                  </span>
                  {informationalExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                
                <AnimatePresence>
                  {informationalExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden rounded-xl bg-secondary/30 divide-y divide-border/50"
                    >
                      {informationalPulses.map(signal => (
                        <InformationalItem key={signal.id} signal={signal} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              RIGHT COLUMN: Auto-Handled + AI Metrics (1/3 width)
          ───────────────────────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Auto-Resolve Stack — Shows what AI handled */}
            <AutoResolveStack autoDemo={true} />
            
            {/* AI Performance Metrics — Collapsible */}
            <div className="rounded-xl bg-secondary/50 overflow-hidden">
              <button
                onClick={() => setAiMetricsExpanded(!aiMetricsExpanded)}
                className="flex items-center gap-2 w-full p-4 text-left hover:bg-secondary/70 transition-colors"
              >
                <Sparkles className="h-4 w-4 text-hero-purple" />
                <span className="text-sm font-medium flex-1">AI Performance</span>
                {aiMetricsExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              
              <AnimatePresence>
                {aiMetricsExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Confidence avg</span>
                        <span className="font-medium">96%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Processing time</span>
                        <span className="font-medium">0.3s avg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Auto-handled today</span>
                        <span className="font-medium text-signal-green">94%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Time saved</span>
                        <span className="font-medium">45 min</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Monthly Summary — compact */}
            <div className="rounded-xl bg-card p-4 shadow-elevation-low">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">This Month</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold">{completedPulses.length + judgmentPulses.length + 38}</p>
                  <p className="text-xs text-muted-foreground">Total pulses</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-signal-green">94%</p>
                  <p className="text-xs text-muted-foreground">Auto-handled</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drawers & Overlays */}
      <PulseDetailDrawer signal={selectedSignal} open={drawerOpen} onOpenChange={setDrawerOpen} />
      <AICopilotOverlay open={copilotOpen} onClose={() => setCopilotOpen(false)} role="jolanda" />
      
      <AnimatePresence>
        <SuccessCheckmark show={showSuccessCheck} />
      </AnimatePresence>
    </div>
  );
};

export default JolandaView;
