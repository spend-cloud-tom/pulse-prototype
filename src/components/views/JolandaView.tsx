import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRole } from '@/context/RoleContext';
import { locationBudgets, aiAlerts } from '@/data/mockData';
import { classifyAndGroup, ClassifiedSignal } from '@/lib/decisionTypes';
import PulseDetailDrawer from '@/components/PulseDetailDrawer';
import SuccessCheckmark from '@/components/SuccessCheckmark';
import OrchestrationSummary from '@/components/OrchestrationSummary';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, MessageSquare, X, TrendingUp, Sparkles, AlertTriangle, 
  ChevronRight, Euro, PieChart, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import AICopilotOverlay from '@/components/AICopilotOverlay';

/* ─── Budget Card with Visual Progress ─── */
const BudgetCard = ({ location, spent, total, trend, committed }: {
  location: string;
  spent: number;
  total: number;
  trend: string;
  committed: number;
}) => {
  const spentPct = Math.round((spent / total) * 100);
  const committedPct = Math.round((committed / total) * 100);
  const isOverBudget = spentPct > 75;
  const trendUp = trend.startsWith('+');

  return (
    <div className="rounded-2xl bg-card p-5 shadow-elevation-low space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{location}</h3>
        <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-signal-amber' : 'text-signal-green'}`}>
          {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {trend}
        </div>
      </div>
      
      {/* Budget bar with spent + committed */}
      <div className="space-y-2">
        <div className="h-3 w-full rounded-full bg-secondary overflow-hidden flex">
          <div 
            className={`h-full transition-all ${isOverBudget ? 'bg-signal-amber' : 'bg-hero-teal'}`} 
            style={{ width: `${spentPct}%` }} 
          />
          <div 
            className="h-full bg-hero-purple/30" 
            style={{ width: `${committedPct}%` }} 
          />
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <div className={`h-2 w-2 rounded-full ${isOverBudget ? 'bg-signal-amber' : 'bg-hero-teal'}`} />
              Spent €{spent.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-hero-purple/30" />
              Committed €{committed.toLocaleString()}
            </span>
          </div>
          <span className="font-semibold">€{total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Exception Card with AI Explanation ─── */
const ExceptionCard = ({ 
  signal, 
  onSelect,
  onApprove,
  onReject
}: { 
  signal: ClassifiedSignal;
  onSelect: () => void;
  onApprove: () => void;
  onReject: () => void;
}) => {
  // Apply urgency glow for critical/urgent items
  const isUrgent = signal.urgency === 'critical' || signal.urgency === 'urgent';
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl bg-card p-5 shadow-elevation-low space-y-4 ${isUrgent ? 'urgency-glow' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`flex items-center justify-center h-10 w-10 rounded-xl shrink-0 ${
          signal.riskLevel === 'high' ? 'bg-signal-red-bg' : 
          signal.riskLevel === 'medium' ? 'bg-signal-amber-bg' : 'bg-signal-green-bg'
        }`}>
          <Euro className={`h-5 w-5 ${
            signal.riskLevel === 'high' ? 'text-signal-red' : 
            signal.riskLevel === 'medium' ? 'text-signal-amber' : 'text-signal-green'
          }`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold truncate">{signal.description}</p>
            {signal.urgency === 'critical' && (
              <Badge className="text-[10px] bg-signal-red-bg text-signal-red border-0 shrink-0">
                Urgent
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {signal.submitter_name} · {signal.location}
          </p>
        </div>
        
        <p className="text-lg font-bold tabular-nums shrink-0">
          €{(signal.amount || 0).toFixed(2)}
        </p>
      </div>
      
      {/* AI Explanation — inline, not modal */}
      {(signal.ai_reasoning || signal.flag_reason) && (
        <div className="rounded-xl bg-hero-purple-soft/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-hero-purple" />
            <p className="text-xs font-semibold text-hero-purple uppercase tracking-wider">
              AI Insight
            </p>
          </div>
          <p className="text-sm leading-relaxed">
            {signal.ai_reasoning || `Flagged: ${signal.flag_reason}`}
          </p>
          {signal.flag_reason && signal.ai_reasoning && (
            <Badge className="mt-2 text-[10px] bg-signal-amber-bg text-signal-amber border-0">
              {signal.flag_reason}
            </Badge>
          )}
        </div>
      )}
      
      {/* Actions — hierarchy-driven buttons */}
      <div className="flex items-center gap-2 pt-1">
        <Button onClick={onApprove} className="gap-1.5 flex-1">
          <Check className="h-4 w-4" /> Approve
        </Button>
        <Button variant="outline" onClick={onSelect} className="gap-1.5">
          <MessageSquare className="h-4 w-4" /> Query
        </Button>
        <button 
          onClick={onReject}
          className="text-sm text-muted-foreground hover:text-destructive transition-colors px-3"
        >
          Reject
        </button>
      </div>
    </motion.div>
  );
};

/* ─── Main Jolanda View ─── */
const JolandaView = () => {
  const { signals } = useRole();
  const [selectedSignal, setSelectedSignal] = useState<ClassifiedSignal | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [showCompleted, setShowCompleted] = useState(false);
  const [showSuccessCheck, setShowSuccessCheck] = useState(false);

  // Filter for Zonneweide location
  const locationSignals = signals.filter(s => s.location === 'Zonneweide');
  
  const actionPulses = locationSignals.filter(
    s => s.status === 'pending' || s.status === 'needs-clarity'
  ).sort((a, b) => {
    const urgOrder: Record<string, number> = { critical: 0, urgent: 1, normal: 2 };
    return (urgOrder[a.urgency] ?? 2) - (urgOrder[b.urgency] ?? 2);
  });

  const progressPulses = locationSignals.filter(
    s => s.status === 'in-motion' || s.status === 'awaiting-supplier' || s.status === 'approved'
  );
  
  const completedPulses = locationSignals.filter(
    s => s.status === 'delivered' || s.status === 'closed' || s.status === 'auto-approved'
  );

  const { approvals, exceptions, alerts } = useMemo(() => classifyAndGroup(actionPulses), [actionPulses]);
  // Filter out approved/rejected items for demo
  const allDecisions = [...exceptions, ...approvals, ...alerts].filter(
    s => !approvedIds.has(s.id) && !rejectedIds.has(s.id)
  );
  
  // Handle approve with visual feedback + success animation
  const handleApprove = (signal: ClassifiedSignal) => {
    // Show success checkmark animation
    setShowSuccessCheck(true);
    setTimeout(() => setShowSuccessCheck(false), 800);
    
    setApprovedIds(prev => new Set([...prev, signal.id]));
    toast({
      title: "✅ Approved — sent to procurement",
      description: `€${(signal.amount || 0).toFixed(2)} for "${signal.description?.slice(0, 25)}..." approved. Sarah will process the order.`,
    });
    // Show follow-up notification
    setTimeout(() => {
      toast({
        title: "📦 Order initiated",
        description: `Sarah has started processing the order with MedSupply NL.`,
      });
    }, 2500);
  };
  
  // Handle reject with visual feedback
  const handleReject = (signal: ClassifiedSignal) => {
    setRejectedIds(prev => new Set([...prev, signal.id]));
    toast({
      title: "❌ Rejected — notifying submitter",
      description: `${signal.submitter_name} will be notified with the reason.`,
    });
  };
  
  const totalPendingValue = actionPulses.reduce((sum, s) => sum + (s.amount || 0), 0);
  const totalCommitted = progressPulses.reduce((sum, s) => sum + (s.amount || 0), 0);

  const openDrawer = (signal: ClassifiedSignal) => {
    setSelectedSignal(signal);
    setDrawerOpen(true);
  };

  // Calculate orchestration stats
  const totalPulses = locationSignals.length;
  const autoHandled = completedPulses.length + progressPulses.length;
  const decisionsNeeded = allDecisions.length;

  return (
    <div className="min-h-screen">
      {/* Orchestration Summary — THE KEY DIFFERENTIATOR */}
      <div className="max-w-5xl mx-auto px-6 pt-6">
        <OrchestrationSummary
          totalPulses={totalPulses > 0 ? totalPulses : 47}
          autoHandled={autoHandled > 0 ? autoHandled : 44}
          decisionsNeeded={decisionsNeeded > 0 ? decisionsNeeded : 3}
          timeSavedMinutes={45}
        />
      </div>

      {/* Header with budget overview */}
      <div className="border-b border-border bg-gradient-to-r from-hero-purple-soft/30 via-background to-hero-teal-soft/30 mt-6">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight">
                Zonneweide
              </h1>
              <p className="text-muted-foreground mt-1">
                {allDecisions.length > 0 ? allDecisions.length : 3} decisions need your judgment · €{totalPendingValue > 0 ? totalPendingValue.toLocaleString() : '654'} to review
              </p>
            </div>
            
            <button
              onClick={() => setCopilotOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card shadow-elevation-low text-sm hover:shadow-elevation-medium transition-shadow"
            >
              <span>🧠</span>
              <span>AI Insights</span>
            </button>
          </div>
          
          {/* Budget cards */}
          <div className="grid md:grid-cols-3 gap-4">
            {locationBudgets.map(loc => (
              <BudgetCard
                key={loc.location}
                location={loc.location}
                spent={loc.spent}
                total={loc.total}
                trend={loc.trend}
                committed={Math.round(loc.total * 0.15)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Decisions feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold">Needs your decision</h2>
                {exceptions.length > 0 && (
                  <Badge className="text-[10px] bg-signal-amber-bg text-signal-amber border-0">
                    {exceptions.length} flagged
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {allDecisions.length} items
              </p>
            </div>
            
            {/* Decision cards */}
            <div className="space-y-4">
              {allDecisions.map(signal => (
                <ExceptionCard
                  key={signal.id}
                  signal={signal}
                  onSelect={() => openDrawer(signal)}
                  onApprove={() => handleApprove(signal)}
                  onReject={() => handleReject(signal)}
                />
              ))}
              
              {allDecisions.length === 0 && (
                <div className="rounded-2xl bg-signal-green-bg/50 p-8 text-center">
                  <Check className="h-8 w-8 text-signal-green mx-auto mb-3" />
                  <p className="font-semibold text-signal-green">All clear</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    No decisions pending for Zonneweide
                  </p>
                </div>
              )}
            </div>
            
            {/* In progress — collapsed by default */}
            {progressPulses.length > 0 && (
              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-hero-teal animate-pulse" />
                  <span className="text-sm font-medium">In progress</span>
                  <span className="text-sm">{progressPulses.length}</span>
                  <span className="text-xs">· €{totalCommitted.toLocaleString()} committed</span>
                </div>
              </div>
            )}
            
            {/* Completed — toggle */}
            {completedPulses.length > 0 && (
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Check className="h-4 w-4 text-signal-green" />
                  <span className="text-sm font-medium">Recently completed</span>
                  <span className="text-sm">{completedPulses.length}</span>
                  <ChevronRight className={`h-4 w-4 transition-transform ${showCompleted ? 'rotate-90' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {showCompleted && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-2"
                    >
                      {completedPulses.slice(0, 5).map(signal => (
                        <div key={signal.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">{signal.description}</p>
                            <p className="text-xs text-muted-foreground">{signal.submitter_name}</p>
                          </div>
                          <p className="text-sm tabular-nums text-muted-foreground">€{(signal.amount || 0).toFixed(2)}</p>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
          
          {/* Right: AI Alerts sidebar */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-hero-purple" />
              <h3 className="font-semibold">AI Alerts</h3>
            </div>
            
            <div className="space-y-3">
              {aiAlerts.slice(0, 4).map(alert => (
                <div 
                  key={alert.id} 
                  className="rounded-xl bg-card p-4 shadow-elevation-low space-y-2"
                >
                  <p className="text-sm leading-relaxed">{alert.message}</p>
                  <Button size="sm" variant="outline" className="text-xs h-7 w-full">
                    Review
                  </Button>
                </div>
              ))}
            </div>
            
            {/* Quick stats */}
            <div className="rounded-xl bg-secondary/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">This month</h4>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-2xl font-bold">{completedPulses.length + allDecisions.length}</p>
                  <p className="text-xs text-muted-foreground">Total requests</p>
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

      <PulseDetailDrawer signal={selectedSignal} open={drawerOpen} onOpenChange={setDrawerOpen} />
      <AICopilotOverlay open={copilotOpen} onClose={() => setCopilotOpen(false)} role="jolanda" />
      
      {/* Success checkmark animation overlay */}
      <AnimatePresence>
        <SuccessCheckmark show={showSuccessCheck} />
      </AnimatePresence>
    </div>
  );
};

export default JolandaView;
