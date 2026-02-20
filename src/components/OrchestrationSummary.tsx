import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

interface OrchestrationSummaryProps {
  totalPulses: number;  // Total requests processed
  autoHandled: number;
  decisionsNeeded: number;
  timeSavedMinutes?: number;
  compact?: boolean;
}

/**
 * Orchestration Summary — Shows AI's systemic impact at a glance.
 * 
 * Key message: "AI handled X% automatically. You have Y decisions."
 * This is the core value proposition visualization.
 */
const OrchestrationSummary = ({ 
  totalPulses, 
  autoHandled, 
  decisionsNeeded,
  timeSavedMinutes = 45,
  compact = false,
}: OrchestrationSummaryProps) => {
  const autoHandledPct = totalPulses > 0 ? Math.round((autoHandled / totalPulses) * 100) : 0;
  
  if (compact) {
    return (
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-signal-green">
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-semibold">{autoHandledPct}%</span>
          <span className="text-muted-foreground">auto-handled</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-hero-teal" />
          <span className="font-semibold">{decisionsNeeded}</span>
          <span className="text-muted-foreground">need you</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      className="rounded-2xl bg-gradient-to-r from-hero-teal-soft/50 via-background to-hero-purple-soft/50 border border-border/50 p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-full bg-hero-teal/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-hero-teal" />
        </div>
        <div>
          <p className="text-sm font-semibold">AI Orchestration Active</p>
          <p className="text-xs text-muted-foreground">Real-time signal processing</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Requests Awaiting Action */}
        <div className="text-center">
          <motion.p 
            className="text-3xl font-bold text-state-decision"
            initial={{ scale: 0.5 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', delay: 0.1 }}
          >
            {decisionsNeeded}
          </motion.p>
          <p className="text-xs font-medium mt-1">Needs Action</p>
          <p className="text-[10px] text-state-decision">Your Decision</p>
        </div>

        {/* Requests In Progress */}
        <div className="text-center">
          <motion.p 
            className="text-3xl font-bold text-state-blocked"
            initial={{ scale: 0.5 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
            {totalPulses - autoHandled - decisionsNeeded}
          </motion.p>
          <p className="text-xs font-medium mt-1">In Progress</p>
          <p className="text-[10px] text-state-blocked">Being processed</p>
        </div>

        {/* Auto-Resolved Today */}
        <div className="text-center">
          <motion.p 
            className="text-3xl font-bold text-hero-purple"
            initial={{ scale: 0.5 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', delay: 0.3 }}
          >
            {autoHandled}
          </motion.p>
          <p className="text-xs font-medium mt-1">Auto-Resolved</p>
          <p className="text-[10px] text-hero-purple">Today</p>
        </div>
      </div>

      {/* Request Pipeline Summary */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground mb-2">Request Pipeline — {totalPulses} total today:</p>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-hero-purple-soft text-hero-purple">
            🟣 {autoHandled} Auto-Handled
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-state-resolved-bg text-state-resolved">
            🟢 {Math.round(autoHandled * 0.3)} Resolved
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-state-blocked-bg text-state-blocked">
            🟡 {totalPulses - autoHandled - decisionsNeeded} In Motion
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default OrchestrationSummary;
