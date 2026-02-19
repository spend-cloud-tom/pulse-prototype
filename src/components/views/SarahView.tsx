import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRole } from '@/context/RoleContext';
import MaintenancePanel from '@/components/MaintenancePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, Sparkles, Brain, Package, Truck, FileText, 
  ChevronRight, Clock, AlertCircle, CheckCircle2, Zap
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import AICopilotOverlay from '@/components/AICopilotOverlay';

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

/* ─── Order Status Card ─── */
const OrderCard = ({ order }: { order: typeof activeOrders[0] }) => {
  const statusConfig = {
    shipped: { icon: Truck, color: 'text-hero-teal', bg: 'bg-hero-teal-soft', label: 'In transit' },
    processing: { icon: Clock, color: 'text-signal-amber', bg: 'bg-signal-amber-bg', label: 'Processing' },
    delivered: { icon: CheckCircle2, color: 'text-signal-green', bg: 'bg-signal-green-bg', label: 'Delivered' },
  };
  const config = statusConfig[order.status];
  const Icon = config.icon;

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
    </div>
  );
};

/* ─── Queue Item for Procurement ─── */
const QueueItem = ({ 
  signal, 
  suggestion,
  onAssign 
}: { 
  signal: any;
  suggestion?: { vendor: string; confidence: number; savings: string };
  onAssign: () => void;
}) => {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-elevation-low space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-signal-amber-bg shrink-0">
          <Package className="h-5 w-5 text-signal-amber" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{signal.description}</p>
          <p className="text-sm text-muted-foreground">
            {signal.submitter_name} · {signal.location}
          </p>
        </div>
        
        {signal.amount && (
          <p className="font-semibold tabular-nums shrink-0">€{signal.amount.toFixed(2)}</p>
        )}
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
              title: "✅ Supplier Assigned",
              description: `${suggestion.vendor} assigned. PO will be generated.`,
            })}
          >
            <Check className="h-3.5 w-3.5" /> Assign
          </Button>
        </div>
      )}
      
      {!suggestion && (
        <Button 
          variant="outline" 
          onClick={() => {
            onAssign();
            toast({
              title: "📦 Assign Supplier",
              description: "Opening supplier selection...",
            });
          }} 
          className="w-full gap-1.5"
        >
          <Package className="h-4 w-4" /> Assign supplier
        </Button>
      )}
    </div>
  );
};

/* ─── Main Sarah View ─── */
const SarahView = () => {
  const { signals } = useRole();
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'orders' | 'auto'>('queue');
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [generatedPOs, setGeneratedPOs] = useState<Set<string>>(new Set());
  const [orderStatuses, setOrderStatuses] = useState<Record<string, string>>({});

  // Filter signals, excluding assigned ones
  const actionPulses = signals.filter(
    s => (s.status === 'awaiting-supplier' || 
    (s.signal_type === 'maintenance' && (s.status === 'pending' || s.status === 'needs-clarity'))) &&
    !assignedIds.has(s.id)
  );
  const progressPulses = signals.filter(s => s.status === 'in-motion');
  
  const readyAutoPOs = autoPOCandidates.filter(c => c.ready && !generatedPOs.has(c.item));
  const pendingAutoPOs = autoPOCandidates.filter(c => !c.ready);
  
  // Handle assigning a supplier to a pulse
  const handleAssignSupplier = (signalId: string, description: string, vendor: string) => {
    setAssignedIds(prev => new Set([...prev, signalId]));
    toast({
      title: "✅ Supplier assigned — PO created",
      description: `${vendor} will fulfill "${description?.slice(0, 25)}..."`,
    });
    // Simulate order confirmation
    setTimeout(() => {
      toast({
        title: "📧 Order confirmed",
        description: `${vendor} confirmed. Expected delivery: Tomorrow 10:00`,
      });
    }, 2000);
  };
  
  // Handle generating auto-POs
  const handleGenerateAutoPOs = () => {
    const items = readyAutoPOs.map(po => po.item);
    items.forEach(item => setGeneratedPOs(prev => new Set([...prev, item])));
    toast({
      title: "📄 Auto-POs Generated",
      description: `${items.length} purchase orders created and sent to suppliers.`,
    });
    // Simulate supplier responses
    setTimeout(() => {
      toast({
        title: "📧 Suppliers notified",
        description: "All vendors have been emailed. Tracking will update automatically.",
      });
    }, 1500);
  };
  
  // Handle generating single PO
  const handleGenerateSinglePO = (item: string, vendor: string) => {
    setGeneratedPOs(prev => new Set([...prev, item]));
    toast({
      title: "📄 PO Generated",
      description: `Purchase order for ${item} sent to ${vendor}.`,
    });
  };
  
  // Handle escalating a bottleneck
  const handleEscalate = (item: string) => {
    toast({
      title: "⚠️ Escalated to Jolanda",
      description: `${item} flagged for manager review. She'll see it in her feed.`,
    });
    setTimeout(() => {
      toast({
        title: "👀 Jolanda notified",
        description: "She's reviewing the escalation now.",
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight">
                Procurement
              </h1>
              <p className="text-muted-foreground mt-1">
                {actionPulses.length} in queue · {activeOrders.filter(o => o.status !== 'delivered').length} orders in transit
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {readyAutoPOs.length > 0 && (
                <Button 
                  className="gap-2 shadow-elevation-low"
                  onClick={handleGenerateAutoPOs}
                >
                  <Zap className="h-4 w-4" />
                  Generate {readyAutoPOs.length} Auto-POs
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
          
          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-border -mb-px">
            {[
              { key: 'queue', label: 'Order Queue', count: actionPulses.length },
              { key: 'orders', label: 'Active Orders', count: activeOrders.filter(o => o.status !== 'delivered').length },
              { key: 'auto', label: 'Auto-PO', count: autoPOCandidates.length },
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
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Main content area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Queue tab */}
            {activeTab === 'queue' && (
              <>
                {actionPulses.length > 0 ? (
                  actionPulses.map((signal, i) => {
                    const suggestion = vendorSuggestions.find(v => 
                      signal.description?.toLowerCase().includes(v.pulse.toLowerCase().split(' ')[0])
                    );
                    return (
                      <QueueItem
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
                    <p className="font-semibold text-signal-green">Queue clear</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      All orders have been assigned to suppliers
                    </p>
                  </div>
                )}
                
                {/* Bottlenecks */}
                {bottlenecks.length > 0 && (
                  <div className="space-y-3 pt-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-signal-amber" />
                      <h3 className="text-sm font-semibold">Bottlenecks</h3>
                    </div>
                    {bottlenecks.map((b, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-signal-amber-bg/30 border border-signal-amber/20">
                        <div>
                          <p className="font-medium">{b.item}</p>
                          <p className="text-sm text-muted-foreground">{b.blocker}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-signal-amber">{b.days} days</p>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="mt-1 text-xs h-7"
                            onClick={() => handleEscalate(b.item)}
                          >
                            Escalate
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Orders tab */}
            {activeTab === 'orders' && (
              <div className="space-y-3">
                {activeOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}

            {/* Auto-PO tab */}
            {activeTab === 'auto' && (
              <div className="space-y-6">
                {/* Ready to generate */}
                {readyAutoPOs.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-hero-teal" />
                        <h3 className="text-sm font-semibold">Ready to generate</h3>
                      </div>
                      <Button 
                        size="sm" 
                        className="gap-1.5"
                        onClick={handleGenerateAutoPOs}
                      >
                        <FileText className="h-3.5 w-3.5" /> Generate all
                      </Button>
                    </div>
                    {readyAutoPOs.map((po, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-card shadow-elevation-low">
                        <div className="flex items-center gap-3">
                          {po.recurring && (
                            <Badge className="text-[10px] bg-hero-teal-soft text-hero-teal border-0">
                              Recurring
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
                            onClick={() => handleGenerateSinglePO(po.item, po.vendor)}
                          >
                            <FileText className="h-3.5 w-3.5" /> Generate
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Needs approval */}
                {pendingAutoPOs.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold text-muted-foreground">Awaiting approval</h3>
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
                        title: "✅ Vendor Accepted",
                        description: `${vs.vendor} selected for ${vs.pulse}. Savings: ${vs.savings}`,
                      })}
                    >
                      <Check className="h-3 w-3" /> {vs.vendor}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick stats */}
            <div className="rounded-xl bg-secondary/50 p-4 space-y-3">
              <h4 className="text-sm font-medium">This week</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-2xl font-bold">{activeOrders.length}</p>
                  <p className="text-xs text-muted-foreground">Orders placed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-signal-green">€{readyAutoPOs.reduce((s, p) => s + p.amount, 0).toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Auto-PO ready</p>
                </div>
              </div>
            </div>

            {/* Maintenance panel */}
            <MaintenancePanel />
          </div>
        </div>
      </div>

      <AICopilotOverlay open={copilotOpen} onClose={() => setCopilotOpen(false)} role="sarah" />
    </div>
  );
};

export default SarahView;
