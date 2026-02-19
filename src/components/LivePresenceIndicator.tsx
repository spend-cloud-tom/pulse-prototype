import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystemHealth } from '@/context/SystemHealthContext';
import { SignalEvent } from '@/hooks/useSignalEvents';
import { 
  Sparkles, CheckCircle2, AlertTriangle, ArrowRight, 
  Clock, ChevronDown, ChevronUp, Zap 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LivePresenceIndicatorProps {
  compact?: boolean;
  className?: string;
}

const eventConfig: Record<string, { icon: typeof Sparkles; color: string; label: string }> = {
  auto_resolved: { icon: Zap, color: 'text-signal-green', label: 'Auto-resolved' },
  approved: { icon: CheckCircle2, color: 'text-signal-green', label: 'Approved' },
  escalated: { icon: AlertTriangle, color: 'text-signal-amber', label: 'Escalated' },
  rejected: { icon: AlertTriangle, color: 'text-signal-red', label: 'Rejected' },
  status_change: { icon: ArrowRight, color: 'text-hero-teal', label: 'Updated' },
  created: { icon: Sparkles, color: 'text-hero-purple', label: 'New' },
};

const formatTimeAgo = (dateStr: string) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
};

const EventItem = ({ event, isNew }: { event: SignalEvent; isNew?: boolean }) => {
  const config = eventConfig[event.event_type] || eventConfig.status_change;
  const Icon = config.icon;

  return (
    <motion.div
      initial={isNew ? { opacity: 0, x: -20, scale: 0.95 } : false}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'flex items-start gap-2.5 py-2 px-3 rounded-lg transition-colors',
        isNew && 'bg-hero-teal-soft/30'
      )}
    >
      <div className={cn('mt-0.5', config.color)}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">
          {event.metadata?.title || 'Signal updated'}
        </p>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className={config.color}>{config.label}</span>
          {event.actor_name && event.actor_role !== 'system' && (
            <>
              <span>·</span>
              <span>{event.actor_name}</span>
            </>
          )}
          <span>·</span>
          <span>{formatTimeAgo(event.created_at)}</span>
        </div>
      </div>
      {event.metadata?.amount && (
        <span className="text-xs font-medium tabular-nums shrink-0">
          €{event.metadata.amount.toFixed(2)}
        </span>
      )}
    </motion.div>
  );
};

const LivePresenceIndicator = ({ compact = false, className }: LivePresenceIndicatorProps) => {
  const { recentEvents, activitySummary } = useSystemHealth();
  const [expanded, setExpanded] = useState(!compact);

  if (compact) {
    return (
      <div className={cn('rounded-xl border border-border/50 bg-card overflow-hidden', className)}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-8 w-8 rounded-full bg-hero-teal-soft flex items-center justify-center">
                <Zap className="h-4 w-4 text-hero-teal" />
              </div>
              {/* Live indicator dot */}
              <motion.div
                className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-signal-green border-2 border-card"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Live Activity</p>
              <p className="text-xs text-muted-foreground">
                {activitySummary.autoResolved} auto-resolved · {activitySummary.approved} approved
              </p>
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-border/50"
            >
              <div className="max-h-64 overflow-y-auto">
                {recentEvents.slice(0, 8).map((event, i) => (
                  <EventItem key={event.id} event={event} isNew={i === 0} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Full version
  return (
    <div className={cn('space-y-3', className)}>
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Zap className="h-4 w-4 text-hero-teal" />
            <motion.div
              className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-signal-green"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <h3 className="text-sm font-semibold">Live Activity</h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Last 24h
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-signal-green-bg/50 px-2 py-1.5">
          <p className="text-lg font-bold text-signal-green">{activitySummary.autoResolved}</p>
          <p className="text-[10px] text-muted-foreground">Auto-resolved</p>
        </div>
        <div className="rounded-lg bg-secondary/50 px-2 py-1.5">
          <p className="text-lg font-bold">{activitySummary.approved}</p>
          <p className="text-[10px] text-muted-foreground">Approved</p>
        </div>
        <div className="rounded-lg bg-signal-amber-bg/50 px-2 py-1.5">
          <p className="text-lg font-bold text-signal-amber">{activitySummary.escalated}</p>
          <p className="text-[10px] text-muted-foreground">Escalated</p>
        </div>
      </div>

      {/* Event feed */}
      <div className="space-y-1 max-h-48 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {recentEvents.slice(0, 6).map((event, i) => (
            <EventItem key={event.id} event={event} isNew={i === 0} />
          ))}
        </AnimatePresence>
      </div>

      {/* Time saved */}
      {activitySummary.timeSavedSeconds > 0 && (
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-border/50">
          <Sparkles className="h-3 w-3 text-hero-purple" />
          <span className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {Math.round(activitySummary.timeSavedSeconds / 60)} min
            </span>
            {' '}saved by AI today
          </span>
        </div>
      )}
    </div>
  );
};

export default LivePresenceIndicator;
