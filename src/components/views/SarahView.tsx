import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRole } from '@/context/RoleContext';
import { signalTypeConfig } from '@/data/mockData';
import MaintenancePanel from '@/components/MaintenancePanel';
import SuccessCheckmark from '@/components/SuccessCheckmark';
import PulseTypeTag from '@/components/PulseTypeTag';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Check, Sparkles, Brain, Package, Truck, FileText, 
  ChevronRight, Clock, AlertCircle, CheckCircle2, Zap, User, MapPin, ArrowRight
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import AICopilotOverlay from '@/components/AICopilotOverlay';
import { pulseActions } from '@/lib/pulseActions';

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

/* ─── Mock Data ─── */
const vendorSuggestions = [
  { pulse: 'Medical gloves order', vendor: 'MedSupply NL', confidence: 96, reason: 'Contracted vendor, best price, 2-day delivery', savings: '€12.40' },
  { pulse: 'Cleaning products', vendor: 'Schoonmaak B.V.', confidence: 91, reason: 'Preferred supplier, volume discount applies', savings: '€8.20' },
];

const activeOrders = [
  { id: 'ORD-2891', supplier: 'MedSupply NL', items: 'Medical supplies (14 items)', status: 'shipped' as const, eta: 'Tomorrow 10:00', tracking: 'NL-PKG-44921', amount: 245.00 },
  { id: 'ORD-2888', supplier: 'Schoonmaak B.V.', items: 'Cleaning products (8 items)', status: 'processing' as const, eta: 'Wed Feb 21', tracking: null, amount: 189.50 },
  { id: 'ORD-2885', supplier: 'Albert Heijn', items: 'Weekly groceries', status: 'delivered' as const, eta: null, tracking: null, amount: 67.40 },
];

const autoPOCandidates = [
  { item: 'Hand soap refill — Zonneweide', amount: 42.00, vendor: 'Schoonmaak B.V.', reason: 'Within €50 auto-threshold', ready: true, recurring: true },
  { item: 'Printer paper — all locations', amount: 89.00, vendor: 'Staples NL', reason: 'Monthly restock', ready: true, recurring: true },
  { item: 'Incontinence supplies', amount: 340.00, vendor: 'MedSupply NL', reason: 'Exceeds auto-threshold', ready: false, recurring: false },
];

const bottlenecks = [
  { item: 'Wheelchair repair', blocker: 'Waiting for parts from supplier', days: 3, severity: 'medium' as const },
  { item: 'Kitchen equipment', blocker: 'Pending manager approval', days: 1, severity: 'low' as const },
];

/* ─── Order Progress Config ─── */
const orderStages = ['Ordered', 'Processing', 'Shipped', 'Delivered'] as const;

const orderProgress: Record<string, { value: number; stageIndex: number; barColor: string; dotColor: string }> = {
  processing: { value: 50, stageIndex: 1, barColor: 'bg-signal-amber', dotColor: 'border-signal-amber bg-signal-amber' },
  shipped:    { value: 75, stageIndex: 2, barColor: 'bg-hero-teal', dotColor: 'border-hero-teal bg-hero-teal' },
  delivered:  { value: 100, stageIndex: 3, barColor: 'bg-signal-green', dotColor: 'border-signal-green bg-signal-green' },
};

/* ─── Order Status Card ─── */
const OrderCard = ({ order }: { order: typeof activeOrders[0] }) => {
  const statusConfig = {
    shipped: { icon: Truck, color: 'text-hero-teal', bg: 'bg-hero-teal-soft', label: 'In transit' },
    processing: { icon: Clock, color: 'text-signal-amber', bg: 'bg-signal-amber-bg', label: 'Processing' },
    delivered: { icon: CheckCircle2, color: 'text-signal-green', bg: 'bg-signal-green-bg', label: 'Delivered' },
  };
  const config = statusConfig[order.status];
  const Icon = config.icon;
  const progress = orderProgress[order.status];

  return (
    <div className="rounded-2xl bg-card p-4 shadow-elevation-low">
      <div className="flex items-start gap-3">
        <div className={`flex items-center justify-center h-10 w-10 rounded-xl ${config.bg} shrink-0`}>
          <Icon className={`h-5 w-5 ${config.color}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold">{order.supplier}</p>
            <span className="text-xs text-muted-foreground">{order.id}</span>
          </div>
          <p className="text-sm text-muted-foreground">{order.items}</p>
          {order.eta && (
            <p className="text-xs text-muted-foreground mt-1">
              ETA: <span className="font-medium text-foreground">{order.eta}</span>
            </p>
          )}
        </div>
        
        <div className="text-right shrink-0">
          <p className="font-semibold tabular-nums">€{order.amount.toFixed(2)}</p>
          <Badge className={`text-[10px] ${config.bg} ${config.color} border-0 mt-1`}>
            {config.label}
          </Badge>
        </div>
      </div>

      {/* Inline progress bar with stage dots */}
      <div className="mt-3 pt-3 border-t border-slate-100">
        {/* Progress track */}
        <div className="relative h-1.5 w-full rounded-full bg-slate-100">
          <div
            className={cn('absolute inset-y-0 left-0 rounded-full transition-all duration-500', progress.barColor)}
            style={{ width: `${progress.value}%` }}
          />
        </div>

        {/* Stage dots + labels */}
        <div className="flex justify-between mt-2">
          {orderStages.map((stage, i) => {
            const isCompleted = i < progress.stageIndex;
            const isCurrent = i === progress.stageIndex;
            const isActive = isCompleted || isCurrent;

            return (
              <div key={stage} className="flex flex-col items-center" style={{ width: '25%' }}>
                <div
                  className={cn(
                    'rounded-full border-2 transition-all duration-300',
                    isCurrent
                      ? cn('h-3 w-3', progress.dotColor)
                      : isCompleted
                        ? cn('h-2.5 w-2.5', progress.dotColor)
                        : 'h-2.5 w-2.5 border-slate-200 bg-slate-100'
                  )}
                />
                <span
                  className={cn(
                    'text-[10px] mt-1 leading-tight',
                    isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}
                >
                  {stage}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ─── Pulse Card for Procurement Pipeline ─── */
const ProcurementPulseCard = ({ 
  signal, 
  suggestion,
  onAssign 
}: { 
  signal: any;
  suggestion?: { vendor: string; confidence: number; savings: string };
  onAssign: () => void;
}) => {
  const typeConfig = signalTypeConfig[signal.signal_type] || signalTypeConfig.general;
  
  return (
    <div className="rounded-2xl bg-card p-4 shadow-elevation-low space-y-3">
      {/* PULSE TYPE TAG — The key identifier */}
      <div className="flex items-center justify-between">
        <PulseTypeTag type={signal.signal_type} size="sm" />
        {signal.amount && (
          <p className="font-semibold tabular-nums text-lg">€{signal.amount.toFixed(2)}</p>
        )}
      </div>
      
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-signal-amber-bg shrink-0">
          <Package className="h-5 w-5 text-signal-amber" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{signal.description}</p>
        </div>
      </div>
      
      {/* Metadata footer — Creator, Location, Time */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-2 border-t border-border/40">
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
      
      {/* AI Suggestion */}
      {suggestion && (
        <div className="rounded-xl bg-hero-teal-soft/50 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-hero-teal" />
            <div>
              <p className="text-sm font-medium">{suggestion.vendor}</p>
              <p className="text-xs text-muted-foreground">
                {suggestion.confidence}% match · Save {suggestion.savings}
              </p>
            </div>
          </div>
          <Button 
            size="sm" 
            className="gap-1.5"
            onClick={() => toast({
              title: "✅ Owner Assigned",
              description: `${suggestion.vendor} assigned. Moving forward...`,
            })}
          >
            <Check className="h-3.5 w-3.5" /> {pulseActions.assignOwner}
          </Button>
        </div>
      )}
      
      {!suggestion && (
        <Button 
          variant="outline" 
          onClick={() => {
            onAssign();
            toast({
              title: "📦 Assign Owner",
              description: "Opening owner selection...",
            });
          }} 
          className="w-full gap-1.5"
        >
          <User className="h-4 w-4" /> {pulseActions.assignOwner}
        </Button>
      )}
    </div>
  );
};

/* ─── Main Sarah View — Pulse Pipeline for Procurement ─── */
const SarahView = () => {
  const { signals } = useRole();
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'needs-action' | 'in-motion' | 'auto-handled'>('needs-action');
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [generatedPOs, setGeneratedPOs] = useState<Set<string>>(new Set());
  const [orderStatuses, setOrderStatuses] = useState<Record<string, string>>({});
  const [showSuccessCheck, setShowSuccessCheck] = useState(false);

  // Filter signals, excluding assigned ones
  const actionPulses = signals.filter(
    s => (s.status === 'awaiting-supplier' || 
    (s.signal_type === 'maintenance' && (s.status === 'pending' || s.status === 'needs-clarity'))) &&
    !assignedIds.has(s.id)
  );
  const progressPulses = signals.filter(s => s.status === 'in-motion');
  
  const readyAutoPOs = autoPOCandidates.filter(c => c.ready && !generatedPOs.has(c.item));
  const pendingAutoPOs = autoPOCandidates.filter(c => !c.ready);
  
  // Handle assigning an owner with success animation
  const handleAssignOwner = (signalId: string, description: string, vendor: string) => {
    // Show success checkmark animation
    setShowSuccessCheck(true);
    setTimeout(() => setShowSuccessCheck(false), 800);
    
    setAssignedIds(prev => new Set([...prev, signalId]));
    toast({
      title: "✅ Owner assigned",
      description: `${vendor} will handle "${description?.slice(0, 25)}..."`,
    });
    // Simulate order confirmation
    setTimeout(() => {
      toast({
        title: "📧 In motion",
        description: `${vendor} confirmed. Expected completion: Tomorrow 10:00`,
      });
    }, 2000);
  };
  
  // Handle advancing items automatically
  const handleAdvancePulses = () => {
    const items = readyAutoPOs.map(po => po.item);
    items.forEach(item => setGeneratedPOs(prev => new Set([...prev, item])));
    toast({
      title: "⚡ Advanced",
      description: `${items.length} items auto-handled and moving forward.`,
    });
    // Simulate supplier responses
    setTimeout(() => {
      toast({
        title: "📧 Owners notified",
        description: "All assigned owners have been notified. Tracking will update automatically.",
      });
    }, 1500);
  };
  
  // Handle advancing single item
  const handleAdvancePulse = (item: string, vendor: string) => {
    setGeneratedPOs(prev => new Set([...prev, item]));
    toast({
      title: "⚡ Advanced",
      description: `${item} is now in motion with ${vendor}.`,
    });
  };
  
  // Handle escalating a blocked item
  const handleEscalatePulse = (item: string) => {
    toast({
      title: "⚠️ Escalated",
      description: `${item} escalated to Jolanda for review.`,
    });
    setTimeout(() => {
      toast({
        title: "👀 Jolanda notified",
        description: "She's reviewing the escalated Pulse now.",
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen">
      {/* Header — Your Flow */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight">
                Procurement <span className="text-muted-foreground font-normal">· Your Flow</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                <span className="text-signal-red font-medium">{actionPulses.length}</span> awaiting action · 
                <span className="text-signal-amber font-medium">{activeOrders.filter(o => o.status !== 'delivered').length}</span> in motion
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {readyAutoPOs.length > 0 && (
                <Button 
                  className="gap-2 shadow-elevation-low"
                  onClick={handleAdvancePulses}
                >
                  <Zap className="h-4 w-4" />
                  {pulseActions.advancePulse} ({readyAutoPOs.length})
                </Button>
              )}
              
              <button
                onClick={() => setCopilotOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-sm hover:bg-secondary/80 transition-colors"
              >
                <span>📦</span>
                <span>AI Supply</span>
              </button>
            </div>
          </div>
          
          {/* Tabs — Pulse Pipeline states */}
          <div className="flex items-center gap-1 border-b border-border -mb-px">
            {[
              { key: 'needs-action', label: 'Needs Action', count: actionPulses.length, dot: 'bg-signal-red' },
              { key: 'in-motion', label: 'In Motion', count: activeOrders.filter(o => o.status !== 'delivered').length, dot: 'bg-signal-amber' },
              { key: 'auto-handled', label: 'Auto-Handled', count: autoPOCandidates.length, dot: 'bg-hero-purple' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === tab.key 
                    ? 'border-foreground text-foreground' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className={cn('h-2 w-2 rounded-full', tab.dot)} />
                {tab.label}
                <span className="text-xs bg-secondary px-1.5 py-0.5 rounded-full">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Main content area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Needs Action tab */}
            {activeTab === 'needs-action' && (
              <>
                {actionPulses.length > 0 ? (
                  actionPulses.map((signal, i) => {
                    const suggestion = vendorSuggestions.find(v => 
                      signal.description?.toLowerCase().includes(v.pulse.toLowerCase().split(' ')[0])
                    );
                    return (
                      <ProcurementPulseCard
                        key={signal.id}
                        signal={signal}
                        suggestion={suggestion ? {
                          vendor: suggestion.vendor,
                          confidence: suggestion.confidence,
                          savings: suggestion.savings
                        } : undefined}
                        onAssign={() => {}}
                      />
                    );
                  })
                ) : (
                  <div className="rounded-2xl bg-signal-green-bg/50 p-8 text-center">
                    <CheckCircle2 className="h-8 w-8 text-signal-green mx-auto mb-3" />
                    <p className="font-semibold text-signal-green">All clear</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Nothing awaiting your action
                    </p>
                  </div>
                )}
                
                {/* Blocked Pulses */}
                {bottlenecks.length > 0 && (
                  <div className="space-y-3 pt-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-slate-400" />
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Blocked</h3>
                    </div>
                    {bottlenecks.map((b, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
                        <div>
                          <p className="font-medium">{b.item}</p>
                          <p className="text-sm text-muted-foreground">{b.blocker}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-muted-foreground">{b.days} days blocked</p>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="mt-1 text-xs h-7 gap-1"
                            onClick={() => handleEscalatePulse(b.item)}
                          >
                            <ArrowRight className="h-3 w-3" />
                            {pulseActions.escalatePulse}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* In Motion tab */}
            {activeTab === 'in-motion' && (
              <div className="space-y-3">
                {activeOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}

            {/* Auto-Handled tab */}
            {activeTab === 'auto-handled' && (
              <div className="space-y-6">
                {/* Ready to advance */}
                {readyAutoPOs.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-hero-purple" />
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-hero-purple">Ready to Auto-Handle</h3>
                      </div>
                      <Button 
                        size="sm" 
                        className="gap-1.5"
                        onClick={handleAdvancePulses}
                      >
                        <Zap className="h-3.5 w-3.5" /> {pulseActions.advancePulse} All
                      </Button>
                    </div>
                    {readyAutoPOs.map((po, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-card shadow-elevation-low">
                        <div className="flex items-center gap-3">
                          {po.recurring && (
                            <Badge className="text-[10px] bg-hero-purple-soft text-hero-purple border-0">
                              Recurring Pulse
                            </Badge>
                          )}
                          <div>
                            <p className="font-medium">{po.item}</p>
                            <p className="text-sm text-muted-foreground">{po.vendor} · {po.reason}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-semibold tabular-nums">€{po.amount.toFixed(2)}</p>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="gap-1.5"
                            onClick={() => handleAdvancePulse(po.item, po.vendor)}
                          >
                            <ArrowRight className="h-3.5 w-3.5" /> {pulseActions.advancePulse}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Needs approval before auto-handling */}
                {pendingAutoPOs.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-signal-amber" />
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Needs Approval First</h3>
                    </div>
                    {pendingAutoPOs.map((po, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                        <div>
                          <p className="font-medium text-muted-foreground">{po.item}</p>
                          <p className="text-sm text-muted-foreground">{po.vendor} · {po.reason}</p>
                        </div>
                        <p className="font-semibold tabular-nums text-muted-foreground">€{po.amount.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-6">
            {/* AI Suggestions */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-hero-purple" />
                <h3 className="font-semibold">AI Suggestions</h3>
              </div>
              {vendorSuggestions.map((vs, i) => (
                <div key={i} className="rounded-xl bg-card p-4 shadow-elevation-low space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{vs.pulse}</p>
                    <span className="text-xs text-muted-foreground">{vs.confidence}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{vs.reason}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-signal-green font-medium">Save {vs.savings}</span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs h-7 gap-1"
                      onClick={() => toast({
                        title: "✅ Owner Assigned",
                        description: `${vs.vendor} assigned to ${vs.pulse}. Savings: ${vs.savings}`,
                      })}
                    >
                      <Check className="h-3 w-3" /> Assign
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Flow Stats */}
            <div className="rounded-xl bg-secondary/50 p-4 space-y-3">
              <h4 className="text-sm font-medium">This Week</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-2xl font-bold">{activeOrders.length}</p>
                  <p className="text-xs text-muted-foreground">In motion</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-hero-purple">{readyAutoPOs.length}</p>
                  <p className="text-xs text-muted-foreground">Auto-handled</p>
                </div>
              </div>
            </div>

            {/* Maintenance panel */}
            <MaintenancePanel />
          </div>
        </div>
      </div>

      <AICopilotOverlay open={copilotOpen} onClose={() => setCopilotOpen(false)} role="sarah" />
      
      {/* Success checkmark animation overlay */}
      <AnimatePresence>
        <SuccessCheckmark show={showSuccessCheck} />
      </AnimatePresence>
    </div>
  );
};

export default SarahView;
