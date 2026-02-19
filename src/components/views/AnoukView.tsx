import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRole } from '@/context/RoleContext';
import { teamSignals } from '@/data/mockData';
import { Mic, Camera, ChevronRight, Package, Truck, CheckCircle2, AlertCircle, Clock, ShoppingCart, Wrench, Receipt, HelpCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PulseTypeIcon from '@/components/PulseTypeIcon';
import AICopilotOverlay from '@/components/AICopilotOverlay';

/* Quick-Tap template options for Anouk's frequent actions (Anti-Blank Slate) */
const quickTapTemplates = [
  { id: 'supplies', icon: ShoppingCart, label: 'Order supplies', template: 'I need to order: ' },
  { id: 'broken', icon: Wrench, label: 'Report broken item', template: 'Broken item to report: ' },
  { id: 'receipt', icon: Receipt, label: 'Log incidental', template: 'Incidental purchase: €' },
  { id: 'question', icon: HelpCircle, label: 'Can I buy this?', template: 'Can I purchase: ' },
];

/* ─────────────────────────────────────────────────────────────────────────────
   PROGRESS TRACKER — Rich Visual Modeless Feedback (RVMF)
   
   UX Principles Applied:
   - Eliminates navigational excise (no click to see status)
   - Reports normalcy quietly (no alerts, just visual state)
   - De-emphasizes inactive steps (softer colors, not tiny text)
   - Uses weight + icons for accessibility (not color alone)
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
    <div className="flex items-center w-full mt-1.5" role="progressbar" aria-valuenow={currentStep} aria-valuemax={steps.length - 1}>
      {steps.map((step, i) => {
        const isComplete = i < currentStep;
        const isCurrent = i === currentStep;
        const isFuture = i > currentStep;
        const Icon = step.icon;
        
        return (
          <div key={step.key} className="flex items-center flex-1">
            <div 
              className={`flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-[11px] transition-all whitespace-nowrap ${
                isComplete 
                  ? 'text-emerald-600' 
                  : isCurrent 
                    ? 'bg-slate-800 text-white font-semibold' 
                    : 'text-slate-300'
              }`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <Icon className={`h-3 w-3 shrink-0 ${isCurrent ? '' : isComplete ? '' : 'opacity-50'}`} />
              <span className={`hidden sm:inline ${isFuture ? 'font-normal' : isComplete ? 'font-medium' : 'font-semibold'}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-1 ${
                isComplete ? 'bg-emerald-400' : 'bg-slate-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

/* AnoukView no longer needs props - OmniDock is self-contained */

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
          {/* Title + meta group — tightly spaced */}
          <div className="space-y-1">
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
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [showQuickTaps, setShowQuickTaps] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
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

  // Handle input change and hide quick-taps when typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (value.length > 0 && showQuickTaps) {
      setShowQuickTaps(false);
    } else if (value.length === 0) {
      setShowQuickTaps(true);
    }
  };

  // Handle quick-tap selection: prefill and focus (don't execute)
  const handleQuickTap = (template: string) => {
    setInputValue(template);
    setShowQuickTaps(false);
    // Focus input so keyboard slides up, user can tweak or add photo
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSubmit = () => {
    if (inputValue.trim()) {
      toast({
        title: "📝 New request created",
        description: `"${inputValue.slice(0, 40)}${inputValue.length > 40 ? '...' : ''}" — AI is classifying it now.`,
      });
      setInputValue('');
      setShowQuickTaps(true);
      // Simulate AI classification
      setTimeout(() => {
        toast({
          title: "🤖 AI classified your request",
          description: "Category: Supplies · Routed to: Procurement · Budget: Wlz",
        });
      }, 2000);
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

      {/* ─── OMNI-DOCK: Persistent "One Door" Input with Quick-Tap Gallery ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none pb-safe">
        {/* Gradient fade for content scrolling underneath */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent" />
        
        <div className="relative px-4 pb-4 pointer-events-auto">
          
          {/* ─── QUICK-TAP SWIMLANE (Anti-Blank Slate) ─── */}
          {/* Horizontally scrollable, last pill cut off to hint at swiping */}
          <AnimatePresence>
            {showQuickTaps && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10, transition: { duration: 0.15 } }}
                transition={{ duration: 0.2 }}
                className="mb-2 -mx-4 px-4"
              >
                <div 
                  className="flex gap-3 justify-center pb-1"
                >
                  {quickTapTemplates.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleQuickTap(item.template)}
                        className="
                          flex items-center gap-2 
                          px-4 py-2.5
                          rounded-full 
                          bg-slate-100
                          text-slate-700 text-sm font-medium
                          whitespace-nowrap
                          hover:bg-slate-200
                          active:scale-95
                          transition-all duration-150
                          shrink-0
                        "
                      >
                        <Icon className="h-4 w-4 text-teal-600" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── MAIN INPUT DOCK ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="mx-auto max-w-[600px] bg-white rounded-[24px] p-2 flex items-center gap-2"
            style={{
              /* 2-Part Shadow for true physical depth (Refactoring UI) */
              boxShadow: '0 10px 24px hsla(212, 20%, 15%, 0.1), 0 4px 6px hsla(212, 20%, 15%, 0.05)',
            }}
          >
            {/* Text input */}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="I need something..."
              className="flex-1 min-w-0 px-4 py-3 text-base font-normal bg-transparent outline-none text-slate-800 placeholder:text-slate-400 font-display"
            />
            
            {/* Voice button — Brand teal */}
            <button
              onClick={handleVoice}
              className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-150 shrink-0 ${
                isListening 
                  ? 'bg-teal-500 text-white animate-pulse' 
                  : 'bg-teal-50 text-teal-600 hover:bg-teal-100 active:scale-95'
              }`}
              aria-label="Voice input"
            >
              <Mic className="h-5 w-5" />
            </button>
            
            {/* Camera button — Brand coral */}
            <button
              onClick={handleCamera}
              className="h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-150 shrink-0 active:scale-95"
              style={{
                backgroundColor: 'hsl(12, 76%, 95%)',
                color: 'hsl(12, 76%, 50%)',
              }}
              aria-label="Camera input"
            >
              <Camera className="h-5 w-5" />
            </button>
            
            {/* Send button — appears when there's input */}
            {inputValue.trim() && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleSubmit}
                className="h-11 w-11 rounded-xl bg-slate-900 text-white hover:bg-slate-800 active:scale-95 flex items-center justify-center transition-all duration-150 shrink-0"
                aria-label="Send"
              >
                <ChevronRight className="h-5 w-5" />
              </motion.button>
            )}
          </motion.div>
          
        </div>
      </div>

      <AICopilotOverlay open={copilotOpen} onClose={() => setCopilotOpen(false)} role="anouk" />
    </div>
  );
};

export default AnoukView;
