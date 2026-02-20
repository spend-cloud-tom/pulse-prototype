import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, ArrowRight, Zap, AlertTriangle, FileCheck2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Role } from '@/data/types';

interface CopilotStep {
  message: string;
  action?: string;
  visual?: 'gl-autofill' | 'checkmark' | 'progress-bar' | 'anomaly-highlight' | 'none';
  detail?: string;
}

const roleScripts: Record<Role, CopilotStep[]> = {
  anouk: [
    {
      message: "Hey Anouk! 👋 You just snapped a receipt for blue wipes. I've matched it to Ward B's hygiene budget.",
      action: 'See what I found',
      visual: 'none',
    },
    {
      message: "GL code auto-filled: 4210 — Hygiene & Cleaning. Amount: €34.50. All within your auto-approval limit.",
      action: 'Looks good!',
      visual: 'gl-autofill',
      detail: 'No manager approval needed — under €50 threshold.',
    },
    {
      message: "Done! ✅ Your Pulse has been filed. Procurement will handle ordering. You'll get a notification when it ships.",
      visual: 'checkmark',
    },
  ],
  jolanda: [
    {
      message: "Heads up, Jolanda! I noticed 2 urgent purchases from Ward C that look unusual compared to last month's pattern.",
      action: 'Show anomaly details',
      visual: 'none',
    },
    {
      message: "Ward C spending is 34% above average this week. Two items flagged: 'Medical gloves (€189)' and 'Special bedding (€420)' — both from non-contracted suppliers.",
      action: 'What do you recommend?',
      visual: 'anomaly-highlight',
      detail: 'Risk score: Medium. Similar spike happened in Oct 2024 (seasonal).',
    },
    {
      message: "I'd suggest approving the gloves (recurring need, reasonable price) and requesting a quote from a contracted supplier for the bedding. Want me to flag it?",
      action: 'Flag the bedding',
      visual: 'none',
    },
    {
      message: "Done! Bedding pulse moved to 'Needs clarity'. A message has been sent to the submitter asking for a contractor quote. Gloves are ready for your approval.",
      visual: 'checkmark',
    },
  ],
  rohan: [
    {
      message: "Morning Rohan. Three-way match is in progress: 17 invoices pending review today.",
      action: 'Show me the breakdown',
      visual: 'progress-bar',
    },
    {
      message: "I've pre-checked 12 invoices — all matched perfectly (PO ↔ GRN ↔ Invoice). Only 5 need your attention.",
      action: 'What are the issues?',
      visual: 'none',
      detail: '12 auto-matched · 3 variance exceptions · 2 missing PO',
    },
    {
      message: "Top issue: MedSupply NL invoice is €4.80 over PO (+2.5%). Their avg variance is 2.2%, so this is within pattern. The other 2 missing POs are from Albert Heijn — recurring grocery pattern.",
      action: 'Auto-resolve low-risk',
      visual: 'anomaly-highlight',
    },
    {
      message: "Resolved! 3 low-risk exceptions cleared. 2 remaining items moved to your triage queue. Total exposure reduced from €1,240 to €407.",
      visual: 'checkmark',
    },
  ],
  sarah: [
    {
      message: "Hi Sarah! I've been monitoring your supply chain. 2 auto-POs are ready to generate and 1 order has shipped.",
      action: 'Show details',
      visual: 'none',
    },
    {
      message: "Hand soap refill (€42, Schoonmaak B.V.) and printer paper (€89, Staples NL) are within auto-threshold. I've matched them to contracted vendors with the best rates.",
      action: 'Generate both POs',
      visual: 'gl-autofill',
      detail: 'Combined savings: €20.60 vs alternative suppliers.',
    },
    {
      message: "POs generated! 📦 ORD-2892 and ORD-2893 are now in processing. MedSupply NL order (ORD-2891) is arriving tomorrow at 10:00.",
      visual: 'checkmark',
    },
  ],
};

const roleAvatars: Record<Role, { emoji: string; name: string }> = {
  anouk: { emoji: '🤖', name: 'Pulse AI' },
  jolanda: { emoji: '🧠', name: 'Pulse Insights' },
  rohan: { emoji: '📊', name: 'Pulse Finance AI' },
  sarah: { emoji: '📦', name: 'Pulse Supply AI' },
};

interface AICopilotOverlayProps {
  open: boolean;
  onClose: () => void;
  role: Role;
}

const AICopilotOverlay = ({ open, onClose, role }: AICopilotOverlayProps) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [typing, setTyping] = useState(true);
  const [glFilled, setGlFilled] = useState(false);
  const [progressValue, setProgressValue] = useState(0);

  const steps = roleScripts[role];
  const current = steps[stepIndex];
  const avatar = roleAvatars[role];
  const isLastStep = stepIndex === steps.length - 1;

  // Reset when opening or role changes
  useEffect(() => {
    if (open) {
      setStepIndex(0);
      setTyping(true);
      setGlFilled(false);
      setProgressValue(0);
    }
  }, [open, role]);

  // Typing simulation
  useEffect(() => {
    if (!open) return;
    setTyping(true);
    const timer = setTimeout(() => setTyping(false), 800 + current.message.length * 8);
    return () => clearTimeout(timer);
  }, [stepIndex, open, current.message.length]);

  // Visual effects per step
  useEffect(() => {
    if (!open || typing) return;
    if (current.visual === 'gl-autofill') {
      const t = setTimeout(() => setGlFilled(true), 400);
      return () => clearTimeout(t);
    }
    if (current.visual === 'progress-bar') {
      let val = 0;
      const interval = setInterval(() => {
        val += 5;
        setProgressValue(val);
        if (val >= 71) clearInterval(interval); // 12/17 = ~71%
      }, 60);
      return () => clearInterval(interval);
    }
  }, [stepIndex, typing, open, current.visual]);

  const advance = () => {
    if (isLastStep) {
      onClose();
    } else {
      setGlFilled(false);
      setProgressValue(0);
      setStepIndex(i => i + 1);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — z-[200] to appear above OmniDock (z-100) */}
          <motion.div
            className="fixed inset-0 z-[200] bg-foreground/20 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Overlay card — z-[201] to appear above backdrop and OmniDock */}
          <motion.div
            className="fixed bottom-6 left-1/2 z-[201] w-[95vw] max-w-md -translate-x-1/2"
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/40">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-foreground flex items-center justify-center text-sm">
                    {avatar.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{avatar.name}</p>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-signal-green animate-pulse-dot" />
                      <span className="text-[10px] text-muted-foreground">Active</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] border-0 bg-secondary text-muted-foreground">
                    Demo mode
                  </Badge>
                  <button onClick={onClose} className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Message area */}
              <div className="px-4 py-4 space-y-3 min-h-[140px]">
                {/* Step indicator */}
                <div className="flex items-center gap-1">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        i <= stepIndex ? 'bg-foreground flex-[2]' : 'bg-border flex-1'
                      }`}
                    />
                  ))}
                </div>

                {/* Message bubble */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={stepIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {typing ? (
                      <div className="flex items-center gap-1.5 py-3">
                        <motion.div className="h-2 w-2 rounded-full bg-muted-foreground/50" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }} />
                        <motion.div className="h-2 w-2 rounded-full bg-muted-foreground/50" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }} />
                        <motion.div className="h-2 w-2 rounded-full bg-muted-foreground/50" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }} />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm leading-relaxed">{current.message}</p>

                        {/* Detail sub-text */}
                        {current.detail && (
                          <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
                            {current.detail}
                          </p>
                        )}

                        {/* Visual: GL auto-fill */}
                        {current.visual === 'gl-autofill' && (
                          <motion.div
                            className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">GL Code</span>
                              <motion.span
                                className="font-mono font-medium"
                                initial={{ opacity: 0, x: 10 }}
                                animate={glFilled ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 0.4 }}
                              >
                                {glFilled ? '4210 — Hygiene & Cleaning' : '...'}
                              </motion.span>
                            </div>
                            {glFilled && (
                              <motion.div
                                className="flex items-center gap-1.5 text-xs text-signal-green"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span className="font-medium">Auto-filled with 94% confidence</span>
                              </motion.div>
                            )}
                          </motion.div>
                        )}

                        {/* Visual: Progress bar */}
                        {current.visual === 'progress-bar' && (
                          <motion.div
                            className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Invoice matching progress</span>
                              <span className="font-medium tabular-nums">{Math.round(progressValue)}%</span>
                            </div>
                            <Progress value={progressValue} className="h-2" />
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>12 of 17 auto-matched</span>
                              <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> AI-verified</span>
                            </div>
                          </motion.div>
                        )}

                        {/* Visual: Anomaly highlight */}
                        {current.visual === 'anomaly-highlight' && (
                          <motion.div
                            className="rounded-lg border border-signal-amber/30 bg-signal-amber-bg p-3 space-y-1.5"
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <div className="flex items-center gap-1.5 text-xs font-medium text-signal-amber">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Anomaly detected
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Pattern deviation flagged — AI confidence: 87%
                            </p>
                          </motion.div>
                        )}

                        {/* Visual: Checkmark */}
                        {current.visual === 'checkmark' && (
                          <motion.div
                            className="flex items-center justify-center py-2"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.2 }}
                          >
                            <div className="h-12 w-12 rounded-full bg-signal-green/10 flex items-center justify-center">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.4, type: 'spring' }}
                              >
                                <Check className="h-6 w-6 text-signal-green" />
                              </motion.div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Action footer */}
              {!typing && (
                <motion.div
                  className="px-4 pb-4"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {current.action ? (
                    <Button onClick={advance} className="w-full gap-2 rounded-xl h-10 text-sm font-semibold">
                      <Sparkles className="h-4 w-4" />
                      {current.action}
                      <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                    </Button>
                  ) : (
                    <Button onClick={advance} variant="secondary" className="w-full gap-2 rounded-xl h-10 text-sm">
                      {isLastStep ? 'Close' : 'Continue'}
                    </Button>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AICopilotOverlay;
