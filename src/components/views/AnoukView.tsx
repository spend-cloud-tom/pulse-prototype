import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRole } from '@/context/RoleContext';
import { teamSignals, demoImages } from '@/data/mockData';
import { Mic, Camera, ChevronRight, Package, Truck, CheckCircle2, AlertCircle, Clock, ShoppingCart, Wrench, Receipt, HelpCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PulseTypeIcon from '@/components/PulseTypeIcon';
import AICopilotOverlay from '@/components/AICopilotOverlay';
import ImageThumbnail from '@/components/ImageThumbnail';
import { Signal } from '@/data/types';
import { cn } from '@/lib/utils';


const getSignalImage = (signal: Signal): string | null => {
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
  if (title.includes('delivery') || title.includes('package')) return demoImages.deliveryConfirm;
  return null;
};

/* ─────────────────────────────────────────────────────────────────────────────
   PROGRESS TRACKER — Rich Visual Modeless Feedback (RVMF)
   
   UX Principles Applied:
   - Eliminates navigational excise (no click to see status)
   - Reports normalcy quietly (no alerts, just visual state)
   - De-emphasizes inactive steps (softer colors, not tiny text)
   - Uses weight + icons for accessibility (not color alone)
   - Animated checkmarks snap into place with satisfying delays
   ───────────────────────────────────────────────────────────────────────────── */
const ProgressTracker = ({ status }: { status: string }) => {
  const steps = [
    { key: 'requested', label: 'Requested', icon: Clock },
    { key: 'ordered', label: 'Ordered', icon: Package },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
  ];
  
  const statusToStep: Record<string, number> = {
    'pending': 0,
    'needs-clarity': 0,
    'approved': 1,
    'in-motion': 2,
    'awaiting-supplier': 2,
    'delivered': 3,
    'closed': 3,
    'auto-approved': 3,
  };
  
  const currentStep = statusToStep[status] ?? 0;

  return (
    <div className="flex items-center w-full mt-3" role="progressbar" aria-valuenow={currentStep} aria-valuemax={steps.length - 1}>
      {steps.map((step, i) => {
        const isComplete = i < currentStep;
        const isCurrent = i === currentStep;
        const isFuture = i > currentStep;
        const Icon = step.icon;
        
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            {/* Step marker */}
            <motion.div 
              initial={false}
              animate={{
                scale: isCurrent ? 1 : 1,
                opacity: 1,
              }}
              transition={{ 
                type: 'spring', 
                stiffness: 400, 
                damping: 25,
                delay: isComplete ? i * 0.08 : 0,
              }}
              className={cn(
                'flex items-center gap-1.5 text-xs whitespace-nowrap transition-colors',
                isComplete && 'text-emerald-600',
                isCurrent && 'bg-slate-900 text-white px-2.5 py-1 rounded-full font-medium shadow-sm',
                isFuture && 'text-slate-400'
              )}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {isComplete ? (
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 400, 
                    damping: 20,
                    delay: i * 0.12,
                  }}
                  className="flex items-center justify-center h-4 w-4 rounded-full bg-emerald-100"
                >
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                </motion.div>
              ) : (
                <div className={cn(
                  'flex items-center justify-center h-4 w-4 rounded-full',
                  isCurrent && 'bg-white/20',
                  isFuture && 'bg-slate-100'
                )}>
                  <Icon className={cn(
                    'h-3 w-3',
                    isCurrent && 'text-white',
                    isFuture && 'text-slate-400'
                  )} />
                </div>
              )}
              <span className={cn(
                'hidden sm:inline',
                isComplete && 'font-medium',
                isCurrent && 'font-medium',
                isFuture && 'font-normal'
              )}>
                {step.label}
              </span>
            </motion.div>
            
            {/* Connecting line */}
            {i < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 bg-slate-200 rounded-full overflow-hidden min-w-[24px]">
                <motion.div 
                  className="h-full bg-emerald-500 rounded-full"
                  initial={{ width: '0%' }}
                  whileInView={{ width: isComplete ? '100%' : '0%' }}
                  viewport={{ once: true }}
                  transition={{ 
                    duration: 0.5, 
                    delay: i * 0.12,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   STATUS BADGE — Soft pill-shaped indicator (no harsh colors)
   ───────────────────────────────────────────────────────────────────────────── */
const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { label: string; bg: string; text: string }> = {
    'needs-clarity': { label: 'Needs input', bg: 'bg-amber-50', text: 'text-amber-700' },
    'pending': { label: 'Requested', bg: 'bg-slate-100', text: 'text-slate-600' },
    'approved': { label: 'Approved', bg: 'bg-slate-100', text: 'text-slate-600' },
    'in-motion': { label: 'Ordered', bg: 'bg-teal-50', text: 'text-teal-700' },
    'awaiting-supplier': { label: 'With supplier', bg: 'bg-teal-50', text: 'text-teal-700' },
    'delivered': { label: 'Delivered', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    'closed': { label: 'Complete', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    'auto-approved': { label: 'Auto-handled', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  };
  
  const { label, bg, text } = config[status] || { label: status, bg: 'bg-slate-100', text: 'text-slate-600' };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   STATUS CARD — Informational only, no confirmation buttons
   
   UX Principles (Refactoring UI / About Face):
   - Group by proximity: progress bar tightly coupled to content
   - Negative Reporting: delivered items show only "Report an issue" link
   - Do, Don't Ask: no confirmation buttons on delivered items
   ───────────────────────────────────────────────────────────────────────────── */
const StatusCard = ({ 
  signal, 
  variant = 'default',
  onProvideInfo,
  onAskAI
}: { 
  signal: any; 
  variant?: 'needs-input' | 'in-progress' | 'completed' | 'default';
  onProvideInfo?: () => void;
  onAskAI?: () => void;
}) => {
  const isNeedsInput = variant === 'needs-input';
  const isCompleted = variant === 'completed';
  const isDelivered = signal.status === 'delivered' || signal.status === 'closed';
  
  const handleReportIssue = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({
      title: "Issue reported",
      description: "Someone will look into this shortly. The item will remain visible until resolved.",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-5 transition-all ${
        isNeedsInput 
          ? 'bg-amber-50/60' 
          : isDelivered
            ? 'bg-emerald-50/40'
            : 'bg-white'
      }`}
      style={{ 
        boxShadow: isCompleted 
          ? 'none' 
          : '0 2px 4px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)' 
      }}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`flex items-center justify-center h-11 w-11 rounded-xl shrink-0 ${
          isNeedsInput ? 'bg-amber-100' : isDelivered ? 'bg-emerald-100' : isCompleted ? 'bg-emerald-50' : 'bg-slate-100'
        }`}>
          <PulseTypeIcon type={signal.signal_type} className={`h-5 w-5 ${
            isNeedsInput ? 'text-amber-600' : isDelivered ? 'text-emerald-600' : isCompleted ? 'text-emerald-600' : 'text-slate-500'
          }`} />
        </div>
        
        {/* Content — tight spacing within, more padding around */}
        <div className="flex-1 min-w-0">
          {/* Title + meta + thumbnail row */}
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0 space-y-1">
              <p className={`text-[15px] font-semibold leading-snug ${
                isCompleted ? 'text-slate-400' : 'text-slate-800'
              }`}>
                {signal.description}
              </p>
              
              {/* Meta row: amount + location */}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                {signal.amount != null && signal.amount > 0 && (
                  <span className="text-slate-500 tabular-nums font-medium">
                    €{signal.amount.toFixed(2)}
                  </span>
                )}
                <span>·</span>
                <span>{signal.location}</span>
              </div>
            </div>
            
            {/* Small square thumbnail — visual anchor, tap to expand */}
            {getSignalImage(signal) && (
              <ImageThumbnail src={getSignalImage(signal)!} alt="Attachment" size="sm" />
            )}
          </div>
          
          {/* Progress tracker — tightly coupled to content above (mt-2), not to card edge */}
          {variant === 'in-progress' && (
            <div className="mt-2">
              <ProgressTracker status={signal.status} />
            </div>
          )}
          
          {/* Delivered state: show completion + tertiary report link */}
          {isDelivered && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Delivered — auto-closes in 24h
              </span>
              <button 
                onClick={handleReportIssue}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Report an issue
              </button>
            </div>
          )}
          
          {/* Needs input: action buttons */}
          {isNeedsInput && (
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={onProvideInfo}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Provide info
              </button>
              <button
                onClick={onAskAI}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                Ask AI
              </button>
            </div>
          )}
          
          {/* In-progress (non-delivered): subtle report link */}
          {variant === 'in-progress' && !isDelivered && (
            <button 
              onClick={handleReportIssue}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors mt-2"
            >
              Report an issue
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN ANOUK VIEW
   - Constrained to 680px max width, centered
   - Unified "One Door" input at bottom
   - No confirmation buttons, purely informational cards
   - Subtle shadows, generous whitespace
   ───────────────────────────────────────────────────────────────────────────── */
const AnoukView = () => {
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const { signals } = useRole();

  // Filter signals for Anouk, excluding resolved ones for demo
  const mySignals = signals.filter(s => s.submitter_name === 'Anouk van Dijk' && !resolvedIds.has(s.id));
  
  // Needs input (blocking) — requires user action
  const needsInputPulses = mySignals.filter(s => s.status === 'needs-clarity');
  
  // In progress (being handled) — informational only
  const inProgressPulses = mySignals.filter(
    s => s.status === 'pending' || s.status === 'in-motion' || s.status === 'awaiting-supplier' || s.status === 'approved'
  );
  
  // Completed — informational only  
  const completedPulses = mySignals.filter(
    s => s.status === 'delivered' || s.status === 'closed' || s.status === 'auto-approved'
  );

  const hasNeedsInput = needsInputPulses.length > 0;

  // Resolve a pulse (moves it out of "needs input")
  const handleResolve = (signalId: string, description: string) => {
    setResolvedIds(prev => new Set([...prev, signalId]));
    toast({
      title: "✅ Pulse advanced",
      description: `"${description?.slice(0, 35)}..." is now in motion.`,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ─── MAIN SCROLLABLE CONTENT ─── */}
      <div className="flex-1 overflow-auto">
        {/* Constrained width container — max 680px, centered */}
        <div className="max-w-[680px] mx-auto px-5 py-8 space-y-8">
          
          {/* ─── GREETING — Pulse-centric language ─── */}
          <motion.header 
            initial={{ opacity: 0, y: 16 }} 
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {hasNeedsInput ? 'Pulses need you' : 'All Pulses handled'}
            </h1>
            <p className="text-base text-slate-500 leading-relaxed">
              {hasNeedsInput 
                ? `${needsInputPulses.length} ${needsInputPulses.length === 1 ? 'Pulse needs' : 'Pulses need'} your input.`
                : inProgressPulses.length > 0 
                  ? `${inProgressPulses.length} ${inProgressPulses.length === 1 ? 'Pulse is' : 'Pulses are'} in motion.`
                  : 'All Pulses resolved. Enjoy your shift!'
              }
            </p>
          </motion.header>

          {/* ─── NEEDS ACTION — Pulses requiring your input ─── */}
          {hasNeedsInput && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <h2 className="text-sm font-semibold text-signal-red uppercase tracking-wider flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-signal-red animate-pulse" />
                Pulses Awaiting Your Action
              </h2>
              <div className="space-y-4">
                {needsInputPulses.map((signal) => (
                  <StatusCard 
                    key={signal.id} 
                    signal={signal} 
                    variant="needs-input"
                    onProvideInfo={() => handleResolve(signal.id, signal.description)}
                    onAskAI={() => setCopilotOpen(true)}
                  />
                ))}
              </div>
            </motion.section>
          )}

          {/* ─── IN MOTION — Pulses being processed ─── */}
          {inProgressPulses.length > 0 && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="space-y-4"
            >
              <h2 className="text-sm font-semibold text-signal-amber uppercase tracking-wider flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-signal-amber" />
                Pulses In Motion
              </h2>
              <div className="space-y-4">
                {inProgressPulses.map((signal) => (
                  <StatusCard key={signal.id} signal={signal} variant="in-progress" />
                ))}
              </div>
            </motion.section>
          )}

          {/* ─── RESOLVED — Completed Pulses ─── */}
          {completedPulses.length > 0 && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h2 className="text-sm font-semibold text-signal-green uppercase tracking-wider flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-signal-green" />
                Resolved Pulses
              </h2>
              <div className="space-y-4">
                {completedPulses.slice(0, 5).map((signal) => (
                  <StatusCard key={signal.id} signal={signal} variant="completed" />
                ))}
              </div>
            </motion.section>
          )}

          {/* ─── EMPTY STATE ─── */}
          {mySignals.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <p className="text-lg font-medium text-slate-700">Nothing to show</p>
              <p className="text-sm text-slate-500 mt-1">
                Use the input below to request something
              </p>
            </motion.div>
          )}
        </div>
      </div>

      <AICopilotOverlay open={copilotOpen} onClose={() => setCopilotOpen(false)} role="anouk" />
    </div>
  );
};

export default AnoukView;
