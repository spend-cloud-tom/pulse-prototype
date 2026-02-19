import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, X, Check, AlertTriangle, FileText, Package, Sparkles, 
  ShieldAlert, TrendingUp, Clock, ThumbsUp, Eye, Zap, Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Role } from '@/data/types';

type NotifPriority = 'high' | 'medium' | 'low';
type NotifType = 'approval' | 'anomaly' | 'info' | 'action' | 'success';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  description: string;
  aiReason: string;
  priority: NotifPriority;
  time: string;
  actionLabel?: string;
  read: boolean;
}

const notifTypeConfig: Record<NotifType, { icon: typeof Check; colorClass: string }> = {
  approval: { icon: FileText, colorClass: 'text-signal-green bg-signal-green-bg' },
  anomaly: { icon: AlertTriangle, colorClass: 'text-signal-amber bg-signal-amber-bg' },
  info: { icon: Eye, colorClass: 'text-muted-foreground bg-secondary' },
  action: { icon: Zap, colorClass: 'text-signal-red bg-signal-red-bg' },
  success: { icon: ThumbsUp, colorClass: 'text-signal-green bg-signal-green-bg' },
};

const priorityConfig: Record<NotifPriority, { label: string; className: string }> = {
  high: { label: 'High', className: 'bg-signal-red-bg text-signal-red' },
  medium: { label: 'Medium', className: 'bg-signal-amber-bg text-signal-amber' },
  low: { label: 'Low', className: 'bg-secondary text-muted-foreground' },
};

const roleNotifications: Record<Role, Notification[]> = {
  anouk: [
    { id: 'a1', type: 'action', title: 'Receipt needs GL code', description: "Your pharmacy receipt (EUR 67.40) couldn't be auto-classified. Please confirm the category.", aiReason: "AI couldn't match to a budget category - confidence 42%. Manual input needed for audit trail.", priority: 'high', time: '2m ago', actionLabel: 'Add GL code', read: false },
    { id: 'a2', type: 'approval', title: 'Cleaning supplies approved', description: 'Your Pulse #1042 for blue wipes (EUR 34.50) was auto-approved and sent to procurement.', aiReason: 'Amount under EUR 50 threshold. Matched to Ward B hygiene budget with 94% confidence.', priority: 'low', time: '15m ago', read: false },
    { id: 'a3', type: 'info', title: 'MedSupply order arriving', description: 'Medical gloves order (ORD-2891) will be delivered tomorrow at 10:00.', aiReason: 'Tracking data shows package left distribution center. ETA based on historical delivery patterns.', priority: 'medium', time: '1h ago', read: true },
    { id: 'a4', type: 'action', title: 'Missing receipt photo', description: 'Pulse #1038 (transport costs) was flagged - no receipt attached. Rohan needs this for reconciliation.', aiReason: 'Finance requires proof of purchase for items > EUR 25. This blocks the three-way match process.', priority: 'high', time: '3h ago', actionLabel: 'Add photo', read: false },
    { id: 'a5', type: 'success', title: 'All Ward B items cleared', description: '5 routine purchases for Ward B were auto-processed this morning. No action needed.', aiReason: 'All items within auto-approval thresholds. Recurring patterns matched with >90% confidence.', priority: 'low', time: '4h ago', read: true },
  ],
  jolanda: [
    { id: 'j1', type: 'anomaly', title: 'Ward C spend anomaly', description: 'Spending 34% above monthly average. Two non-contracted supplier purchases flagged.', aiReason: "Ward C pattern deviation detected. Similar spike in Oct 2024 was seasonal - but current items don't match seasonal patterns.", priority: 'high', time: '5m ago', actionLabel: 'Review details', read: false },
    { id: 'j2', type: 'approval', title: '3 approvals pending', description: 'Medical gloves (EUR 189), office supplies (EUR 45), and special bedding (EUR 420) await your decision.', aiReason: 'Ranked by budget impact: bedding is highest at EUR 420 from non-contracted supplier. Gloves are recurring and within norms.', priority: 'high', time: '12m ago', actionLabel: 'Review queue', read: false },
    { id: 'j3', type: 'info', title: 'Budget utilization update', description: 'Zonneweide at 68% of monthly budget. De Berk at 45%. Projected safe for remainder of month.', aiReason: 'Linear projection based on current run rate vs remaining days. No risk flags.', priority: 'low', time: '30m ago', read: true },
    { id: 'j4', type: 'anomaly', title: 'Predictive risk: staffing costs', description: 'Overtime hours trending 18% above plan at Zonneweide. May impact Q1 budget.', aiReason: 'Regression model predicts EUR 2,400 over-budget if trend continues. Comparable to Feb 2025 pattern.', priority: 'medium', time: '2h ago', actionLabel: 'View projection', read: false },
    { id: 'j5', type: 'success', title: 'Compliance check passed', description: 'All Zonneweide purchases this week have proper documentation and approval chains.', aiReason: 'Automated compliance scan found 0 violations across 23 processed Pulses.', priority: 'low', time: '5h ago', read: true },
  ],
  rohan: [
    { id: 'r1', type: 'anomaly', title: '3 variance exceptions', description: 'MedSupply NL (+2.5%), Staples NL (+4.1%), and cleaning contractor (+1.8%) exceed PO amounts.', aiReason: 'Clustered by vendor type. MedSupply and cleaning are within historical variance. Staples is new - first occurrence.', priority: 'high', time: '3m ago', actionLabel: 'Reconcile', read: false },
    { id: 'r2', type: 'action', title: '2 missing PO items', description: 'Albert Heijn (EUR 67.40) and pharmacy (EUR 34.20) invoices have no matching purchase orders.', aiReason: 'Both match recurring grocery/pharmacy patterns. Albert Heijn has 12-month history. Recommend auto-generating retroactive POs.', priority: 'high', time: '8m ago', actionLabel: 'Create POs', read: false },
    { id: 'r3', type: 'anomaly', title: 'Shadow spend alert', description: 'EUR 1,240 in non-contracted supplier payments detected this month (+23% vs last month).', aiReason: 'Eight transactions across 3 locations. Largest: EUR 420 bedding purchase at Zonneweide from unknown vendor.', priority: 'medium', time: '45m ago', actionLabel: 'Investigate', read: false },
    { id: 'r4', type: 'success', title: '12 invoices auto-matched', description: 'Three-way match completed for 12 of 17 pending invoices. All within tolerance.', aiReason: 'PO / GRN / Invoice matched automatically. Combined value: EUR 3,420. Average variance: 0.4%.', priority: 'low', time: '1h ago', read: true },
    { id: 'r5', type: 'info', title: 'Budget deviation forecast', description: 'Q1 projected to close 3.2% under budget across all locations. Strongest savings in procurement.', aiReason: 'AI-driven vendor optimization saved EUR 890 this quarter. Auto-PO adoption rate: 67%.', priority: 'low', time: '3h ago', read: true },
  ],
  sarah: [
    { id: 's1', type: 'action', title: 'Order bottleneck detected', description: 'MedSupply NL order (ORD-2888) processing delayed 2 days. No tracking update since Monday.', aiReason: 'Historical delivery time for this vendor is 3 days. Current order is at 5 days. Pattern suggests warehouse backlog.', priority: 'high', time: '10m ago', actionLabel: 'Contact vendor', read: false },
    { id: 's2', type: 'approval', title: '2 auto-POs ready', description: 'Hand soap (EUR 42, Schoonmaak B.V.) and printer paper (EUR 89, Staples NL) within auto-threshold.', aiReason: 'Both items are recurring restocks. Matched to contracted vendors with best available pricing.', priority: 'medium', time: '20m ago', actionLabel: 'Generate POs', read: false },
    { id: 's3', type: 'info', title: 'Vendor recommendation', description: 'AI suggests switching De Berk cleaning supplies to Schoonmaak B.V. - projected EUR 180/month savings.', aiReason: 'Price comparison across 6 vendors. Schoonmaak B.V. offers 12% volume discount and faster delivery.', priority: 'medium', time: '1h ago', actionLabel: 'Compare vendors', read: false },
    { id: 's4', type: 'success', title: 'ORD-2891 shipped', description: 'MedSupply NL medical supplies (14 items) shipped. ETA: Tomorrow 10:00.', aiReason: 'Tracking confirmed via carrier API. On-time delivery probability: 94% based on route history.', priority: 'low', time: '2h ago', read: true },
    { id: 's5', type: 'action', title: 'Incontinence supplies needs approval', description: 'EUR 340 order exceeds auto-threshold. Requires manager sign-off before PO generation.', aiReason: 'Amount exceeds EUR 200 auto-PO limit. Routed to Jolanda for approval. Vendor: MedSupply NL (contracted).', priority: 'high', time: '4h ago', actionLabel: 'Escalate', read: false },
  ],
};

const roleSummaries: Record<Role, string> = {
  anouk: "You have 2 items needing attention: a receipt missing its GL code, and a transport expense without a photo. Good news - 5 routine purchases were auto-cleared this morning, and your medical gloves order arrives tomorrow!",
  jolanda: "Two things to watch: Ward C spending is above average with unusual supplier activity, and you have 3 approvals totaling EUR 654 in your queue. Budget-wise, all locations are tracking well within projections.",
  rohan: "Your triage: 3 invoice variances to reconcile and 2 missing POs to resolve. The good news - 12 invoices were auto-matched overnight and Q1 is projecting under budget. Shadow spend is up 23% though.",
  sarah: "Heads up: one MedSupply order is delayed and may need vendor follow-up. You have 2 auto-POs ready to generate, plus a vendor switch recommendation that could save EUR 180/month at De Berk.",
};

interface NotificationDrawerProps {
  role: Role;
}

const NotificationDrawer = ({ role }: NotificationDrawerProps) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actedIds, setActedIds] = useState<Set<string>>(new Set());
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    setNotifications(roleNotifications[role]);
    setActedIds(new Set());
    setExpandedId(null);
    setShowSummary(false);
  }, [role]);

  const unreadCount = notifications.filter(n => !n.read && !actedIds.has(n.id)).length;

  const handleAction = (id: string) => {
    setActedIds(prev => new Set(prev).add(id));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <>
      {/* Bell trigger */}
      <button
        onClick={() => setOpen(true)}
        className="relative h-9 w-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
      >
        <Bell className="h-4 w-4 text-muted-foreground" />
        {unreadCount > 0 && (
          <motion.span
            className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-signal-red text-[10px] font-bold text-white flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            {unreadCount}
          </motion.span>
        )}
      </button>

      {/* Drawer — rendered via portal to escape header stacking context */}
      {createPortal(
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-foreground/15 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-card border-l border-border shadow-2xl flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <h2 className="text-sm font-semibold">Notifications</h2>
                  {unreadCount > 0 && (
                    <Badge className="text-[10px] py-0 px-1.5 border-0 bg-signal-red-bg text-signal-red font-bold">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[11px] h-7 text-muted-foreground"
                    onClick={handleMarkAllRead}
                  >
                    Mark all read
                  </Button>
                  <button
                    onClick={() => setOpen(false)}
                    className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* AI Summary bar */}
              <div className="px-4 py-2.5 border-b border-border bg-secondary/30 shrink-0">
                <button
                  onClick={() => setShowSummary(!showSummary)}
                  className="flex items-center gap-2 w-full text-left group"
                >
                  <div className="h-7 w-7 rounded-full bg-foreground flex items-center justify-center shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-background" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium group-hover:text-foreground transition-colors">
                      {showSummary ? 'AI Digest' : 'What happened? — AI summary'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Volume2 className="h-3 w-3 text-muted-foreground" />
                    <Badge variant="outline" className="text-[9px] border-0 bg-secondary text-muted-foreground">
                      Demo
                    </Badge>
                  </div>
                </button>
                <AnimatePresence>
                  {showSummary && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="text-xs text-muted-foreground leading-relaxed pt-2 pb-1">
                        {roleSummaries[role]}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Notifications list */}
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {notifications.map((notif, i) => {
                    const typeConf = notifTypeConfig[notif.type];
                    const prioConf = priorityConfig[notif.priority];
                    const Icon = typeConf.icon;
                    const isExpanded = expandedId === notif.id;
                    const isActed = actedIds.has(notif.id);

                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.25 }}
                      >
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : notif.id)}
                          className={`w-full text-left rounded-xl p-3 transition-colors ${
                            isActed
                              ? 'bg-signal-green-bg/50 border border-signal-green/20'
                              : notif.read
                                ? 'hover:bg-secondary/50'
                                : 'bg-card border border-border hover:border-foreground/10'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            {/* Icon */}
                            <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                              isActed ? 'bg-signal-green-bg' : typeConf.colorClass
                            }`}>
                              {isActed ? (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: 'spring', damping: 12 }}
                                >
                                  <Check className="h-3.5 w-3.5 text-signal-green" />
                                </motion.div>
                              ) : (
                                <Icon className="h-3.5 w-3.5" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <p className={`text-[13px] font-medium truncate ${isActed ? 'line-through text-muted-foreground' : ''}`}>
                                  {notif.title}
                                </p>
                                {!notif.read && !isActed && (
                                  <div className="h-1.5 w-1.5 rounded-full bg-signal-red shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {notif.description}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <Badge className={`text-[9px] py-0 px-1.5 border-0 font-medium ${prioConf.className}`}>
                                  {prioConf.label}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">{notif.time}</span>
                              </div>
                            </div>
                          </div>

                          {/* Expanded: AI reason + action */}
                          <AnimatePresence>
                            {isExpanded && !isActed && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-2.5 ml-9 space-y-2">
                                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-2.5 py-2">
                                    <Sparkles className="h-3 w-3 mt-0.5 shrink-0" />
                                    <span>{notif.aiReason}</span>
                                  </div>
                                  {notif.actionLabel && (
                                    <Button
                                      size="sm"
                                      className="gap-1.5 text-xs h-7 rounded-lg"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAction(notif.id);
                                      }}
                                    >
                                      <Zap className="h-3 w-3" />
                                      {notif.actionLabel}
                                    </Button>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Footer — all-clear state */}
              {actedIds.size > 0 && (
                <motion.div
                  className="px-4 py-3 border-t border-border bg-secondary/20 shrink-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ThumbsUp className="h-3.5 w-3.5 text-signal-green" />
                    <span>{actedIds.size} item{actedIds.size > 1 ? 's' : ''} resolved this session</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
      )}
    </>
  );
};

export default NotificationDrawer;
