import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRole } from '@/context/RoleContext';
import { teamSignals } from '@/data/mockData';
import { Mic, Camera, ChevronRight, Package, Truck, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PulseTypeIcon from '@/components/PulseTypeIcon';
import AICopilotOverlay from '@/components/AICopilotOverlay';

/* ─────────────────────────────────────────────────────────────────────────────
   PROGRESS TRACKER — Visual progress bar for purchase tracking
   ───────────────────────────────────────────────────────────────────────────── */
const ProgressTracker = ({ status }: { status: string }) => {
  const steps = [
    { key: 'requested', label: 'Requested', icon: Clock },
    { key: 'ordered', label: 'Ordered', icon: Package },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
  ];
  
  // Map status to step index
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
    <div className="flex items-center gap-1 mt-2">
      {steps.map((step, i) => {
        const isComplete = i < currentStep;
        const isCurrent = i === currentStep;
        const Icon = step.icon;
        
        return (
          <div key={step.key} className="flex items-center">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all ${
              isComplete 
                ? 'bg-emerald-100 text-emerald-700' 
                : isCurrent 
                  ? 'bg-teal-100 text-teal-700' 
                  : 'bg-slate-100 text-slate-400'
            }`}>
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-4 h-0.5 mx-0.5 ${
                isComplete ? 'bg-emerald-300' : 'bg-slate-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

interface AnoukViewProps {
  onNewPulse?: () => void;
}

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
   Subtle shadow, no borders, "Report an issue" tertiary link
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
  
  const handleReportIssue = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({
      title: "Issue reported",
      description: "Someone will look into this shortly.",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-5 transition-all ${
        isNeedsInput 
          ? 'bg-amber-50/60' 
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
          isNeedsInput ? 'bg-amber-100' : isCompleted ? 'bg-emerald-50' : 'bg-slate-100'
        }`}>
          <PulseTypeIcon type={signal.signal_type} className={`h-5 w-5 ${
            isNeedsInput ? 'text-amber-600' : isCompleted ? 'text-emerald-600' : 'text-slate-500'
          }`} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title — dark slate, semibold */}
          <p className={`text-[15px] font-semibold leading-snug ${
            isCompleted ? 'text-slate-400' : 'text-slate-800'
          }`}>
            {signal.description}
          </p>
          
          {/* Meta — softer slate-grey */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={signal.status} />
            {signal.amount != null && signal.amount > 0 && (
              <span className="text-sm text-slate-500 tabular-nums">
                €{signal.amount.toFixed(2)}
              </span>
            )}
          </div>
          
          {/* Routing info — very subtle */}
          <p className="text-xs text-slate-400">
            You → Procurement · {signal.location}
          </p>
          
          {/* Progress tracker for in-progress items */}
          {variant === 'in-progress' && (
            <ProgressTracker status={signal.status} />
          )}
          
          {/* Needs input: action buttons */}
          {isNeedsInput && (
            <div className="flex items-center gap-2 pt-2">
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
          
          {/* Report an issue — tertiary text link, not a button */}
          {!isNeedsInput && (
            <button 
              onClick={handleReportIssue}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors mt-1"
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
const AnoukView = ({ onNewPulse }: AnoukViewProps) => {
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [showInfoDialog, setShowInfoDialog] = useState<string | null>(null);
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
      title: "✅ Info provided — moving to procurement",
      description: `"${description?.slice(0, 35)}..." is now being processed by Sarah.`,
    });
  };

  const handleSubmit = () => {
    if (inputValue.trim()) {
      toast({
        title: "📝 New request created",
        description: `"${inputValue.slice(0, 40)}${inputValue.length > 40 ? '...' : ''}" — AI is classifying it now.`,
      });
      setInputValue('');
      // Simulate AI classification
      setTimeout(() => {
        toast({
          title: "🤖 AI classified your request",
          description: "Category: Supplies · Routed to: Procurement · Budget: Wlz",
        });
      }, 2000);
    } else {
      onNewPulse?.();
    }
  };

  const handleVoice = () => {
    setIsListening(true);
    toast({
      title: "🎤 Listening...",
      description: "Speak now: \"I need...\"",
    });
    // Simulate voice recognition
    setTimeout(() => {
      setIsListening(false);
      setInputValue("New box of disposable gloves for room 12");
      toast({
        title: "🎤 Got it!",
        description: "Review your request below and tap send.",
      });
    }, 2500);
  };

  const handleCamera = () => {
    toast({
      title: "📷 Opening camera...",
      description: "Take a photo of the item or receipt.",
    });
    // Simulate photo capture
    setTimeout(() => {
      toast({
        title: "📷 Photo captured!",
        description: "AI detected: \"Cleaning supplies receipt — €34.50\"",
      });
      setInputValue("Cleaning supplies (from photo) — €34.50");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ─── MAIN SCROLLABLE CONTENT ─── */}
      <div className="flex-1 overflow-auto pb-40">
        {/* Constrained width container — max 680px, centered */}
        <div className="max-w-[680px] mx-auto px-5 py-8 space-y-8">
          
          {/* ─── GREETING ─── */}
          <motion.header 
            initial={{ opacity: 0, y: 16 }} 
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {hasNeedsInput ? 'Quick check needed' : 'All sorted'}
            </h1>
            <p className="text-base text-slate-500 leading-relaxed">
              {hasNeedsInput 
                ? `${needsInputPulses.length} ${needsInputPulses.length === 1 ? 'thing needs' : 'things need'} a bit more info.`
                : inProgressPulses.length > 0 
                  ? `${inProgressPulses.length} ${inProgressPulses.length === 1 ? 'request is' : 'requests are'} being handled.`
                  : 'Everything is taken care of. Enjoy your shift!'
              }
            </p>
          </motion.header>

          {/* ─── NEEDS INPUT SECTION ─── */}
          {hasNeedsInput && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Needs your input
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

          {/* ─── IN PROGRESS SECTION ─── */}
          {inProgressPulses.length > 0 && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="space-y-4"
            >
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Being handled
              </h2>
              <div className="space-y-4">
                {inProgressPulses.map((signal) => (
                  <StatusCard key={signal.id} signal={signal} variant="in-progress" />
                ))}
              </div>
            </motion.section>
          )}

          {/* ─── COMPLETED SECTION ─── */}
          {completedPulses.length > 0 && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                Recently completed
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

      {/* ─── FIXED BOTTOM: UNIFIED "ONE DOOR" INPUT ─── */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-4 pb-6 px-5 safe-area-bottom">
        <div className="max-w-[680px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-2 flex items-center gap-2"
            style={{ 
              boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)' 
            }}
          >
            {/* Text input */}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="I need something..."
              className="flex-1 px-4 py-3 text-base bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
            />
            
            {/* Voice button */}
            <button
              onClick={handleVoice}
              className="h-12 w-12 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors shrink-0"
            >
              <Mic className="h-5 w-5 text-slate-600" />
            </button>
            
            {/* Camera button */}
            <button
              onClick={handleCamera}
              className="h-12 w-12 rounded-xl bg-slate-900 hover:bg-slate-800 flex items-center justify-center transition-colors shrink-0"
            >
              <Camera className="h-5 w-5 text-white" />
            </button>
          </motion.div>
          
          {/* AI helper — subtle, tertiary */}
          <motion.button
            onClick={() => setCopilotOpen(true)}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <span>🤖</span>
            <span>Ask AI what happened</span>
          </motion.button>
        </div>
      </div>

      <AICopilotOverlay open={copilotOpen} onClose={() => setCopilotOpen(false)} role="anouk" />
    </div>
  );
};

export default AnoukView;
