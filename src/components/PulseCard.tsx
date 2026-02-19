import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Signal, ConfidenceLevel, statusToPulseState, PulseState } from '@/data/types';
import { signalTypeConfig, pulseStateConfig } from '@/data/mockData';
import { classifySignal, riskConfig, getWorkflowStage } from '@/lib/decisionTypes';
import PulseTypeIcon from '@/components/PulseTypeIcon';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { HelpCircle, ChevronDown, TrendingUp, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';

interface PulseCardProps {
  signal: Signal;
  variant?: 'action' | 'progress' | 'completed';
  dense?: boolean;
  onClick?: () => void;
  actions?: React.ReactNode;
}

// Type-specific left accent colors
const typeAccent: Record<string, string> = {
  purchase: 'border-l-blue-400',
  maintenance: 'border-l-orange-400',
  incident: 'border-l-signal-red',
  'shift-handover': 'border-l-violet-400',
  compliance: 'border-l-yellow-500',
  event: 'border-l-emerald-400',
  resource: 'border-l-cyan-400',
  general: 'border-l-border',
};

// Urgency badge config
const urgencyBadge: Record<string, { label: string; style: string } | null> = {
  critical: { label: 'Critical', style: 'bg-signal-red-bg text-signal-red' },
  urgent: { label: 'High', style: 'bg-signal-amber-bg text-signal-amber' },
  normal: null,
};

// PULSE STATE LABELS — Unified language across the system
const pulseStateLabels: Record<PulseState, string> = {
  'needs-action': 'Needs Action',
  'in-motion': 'In Motion',
  'blocked': 'Blocked',
  'auto-handled': 'Auto-Handled',
  'resolved': 'Resolved',
};

// Legacy status to display label (for backward compat)
const statusLabels: Record<string, string> = {
  pending: 'Needs Action',
  'needs-clarity': 'Needs Action',
  approved: 'In Motion',
  'in-motion': 'In Motion',
  'awaiting-supplier': 'Blocked',
  'auto-approved': 'Auto-Handled',
  delivered: 'Resolved',
  closed: 'Resolved',
  rejected: 'Resolved',
};

// Owner/next step labels — Who owns this Pulse now?
const ownerLabels: Record<string, string> = {
  pending: 'Awaiting your action',
  'needs-clarity': 'Awaiting your input',
  'in-motion': 'Being processed',
  'awaiting-supplier': 'Waiting on external',
  approved: 'Moving forward',
  'auto-approved': 'AI resolved',
  delivered: 'Complete',
  closed: 'Complete',
  rejected: 'Returned',
};

const formatTimeAgo = (ts: string) => {
  try {
    const d = new Date(ts);
    const now = new Date();
    const diffMin = Math.round((now.getTime() - d.getTime()) / 60000);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.round(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    return `${Math.round(diffH / 24)}d ago`;
  } catch { return ts; }
};

// Workflow stage labels per signal type
const workflowLabels: Record<string, string[]> = {
  purchase: ['Submitted', 'Approved', 'Ordered', 'Delivered', 'Invoiced', 'Closed'],
  maintenance: ['Reported', 'Assessed', 'Scheduled', 'In repair', 'Completed'],
  incident: ['Reported', 'Reviewed', 'Resolved', 'Closed'],
  'shift-handover': ['Submitted', 'Acknowledged'],
  compliance: ['Flagged', 'Under review', 'Resolved'],
  event: ['Planned', 'Confirmed', 'In progress', 'Completed'],
  resource: ['Requested', 'Approved', 'Allocated', 'Closed'],
  general: ['Submitted', 'In review', 'Resolved', 'Closed'],
};

const getDetailedWorkflow = (signal: Signal) => {
  const labels = workflowLabels[signal.signal_type] || workflowLabels.general;
  const total = labels.length;
  const workflow = getWorkflowStage(signal.status);
  const stage = Math.min(Math.round((workflow.stage / workflow.total) * total), total);
  return { labels, total, stage, currentLabel: labels[Math.max(0, stage - 1)] || labels[0] };
};

// Action clarity — does this need the user's action?
const isActionRequired = (signal: Signal): boolean => {
  return signal.status === 'pending' || signal.status === 'needs-clarity';
};

// Parse AI reasoning into bullet points for progressive disclosure
const parseAIReasoning = (reasoning: string | null, flagReason: string | null): string[] => {
  if (!reasoning && !flagReason) return [];
  
  const points: string[] = [];
  
  // Add flag reason as first point if present
  if (flagReason) {
    points.push(`⚠️ ${flagReason}`);
  }
  
  // Parse reasoning - split on periods or common patterns
  if (reasoning) {
    const sentences = reasoning
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 10)
      .slice(0, 3); // Max 3 points
    
    sentences.forEach(s => {
      const cleaned = s.trim();
      if (cleaned && !points.some(p => p.includes(cleaned.slice(0, 20)))) {
        points.push(cleaned);
      }
    });
  }
  
  return points.slice(0, 4); // Max 4 total points
};

const PulseCard = ({ signal, variant = 'action', dense = false, onClick, actions }: PulseCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const typeInfo = signalTypeConfig[signal.signal_type] || signalTypeConfig.general;
  const isCompleted = variant === 'completed';
  const isProgress = variant === 'progress';
  const isAction = variant === 'action';
  const accent = typeAccent[signal.signal_type] || typeAccent.general;
  const classified = classifySignal(signal);
  const risk = riskConfig[classified.riskLevel];
  const detailedWorkflow = getDetailedWorkflow(signal);
  const amt = signal.amount || 0;
  const urgency = urgencyBadge[signal.urgency];
  const needsAction = isActionRequired(signal);
  
  // Get unified Pulse state
  const pulseState = statusToPulseState[signal.status] || 'needs-action';
  const stateConfig = pulseStateConfig[pulseState];

  const handleClick = () => {
    if (onClick) { onClick(); return; }
    if (!isCompleted && signal.description) setExpanded(!expanded);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group relative rounded-xl border border-l-[3px] bg-card transition-all cursor-pointer hover:shadow-sm',
        accent,
        isCompleted ? 'opacity-60 border-border' : 'border-border',
      )}
    >
      <div className={cn('flex items-start gap-3', dense ? 'p-2.5' : 'p-3.5')}>
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Header row — PULSE TYPE TAG prominently displayed */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {/* PULSE TYPE TAG — The key identifier */}
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/80">
                <Zap className="h-2.5 w-2.5 text-hero-purple" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-foreground/80">
                  {typeInfo.pulseLabel || `${typeInfo.label} Pulse`}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground/60 shrink-0">{formatTimeAgo(signal.created_at)}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {/* PULSE STATE badge — Unified state language */}
              <Badge variant="outline" className={cn(
                'text-[10px] py-0 px-1.5 border-0 font-medium',
                stateConfig?.bgColor || 'bg-secondary',
                stateConfig?.color || 'text-muted-foreground'
              )}>
                {stateConfig?.label || statusLabels[signal.status] || signal.status}
              </Badge>
              {/* Urgency badge */}
              {urgency && (
                <Badge className={cn('text-[10px] py-0 px-1.5 border-0 font-medium', urgency.style)}>
                  {urgency.label}
                </Badge>
              )}
              {/* Amount — prominent */}
              {amt > 0 && (
                <span className={cn(
                  'font-semibold text-foreground shrink-0 tabular-nums',
                  amt > 200 ? 'text-base' : 'text-sm',
                )}>
                  €{amt.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className={cn(
            'font-semibold leading-snug',
            dense ? 'text-[13px]' : 'text-sm',
            isCompleted && 'line-through text-muted-foreground'
          )}>
            {signal.title}
          </h3>

          {/* Action clarity line — non-negotiable */}
          {isAction && (
            <p className={cn(
              'text-[11px] font-medium',
              needsAction ? 'text-signal-red' : 'text-muted-foreground/60'
            )}>
              {needsAction ? 'This requires your action.' : 'No action needed — informational.'}
            </p>
          )}

          {/* Submitter + location for dense cards */}
          {dense && (
            <p className="text-[11px] text-muted-foreground">
              {signal.submitter_name} · {signal.location}
              {signal.funding && <span> · {signal.funding}</span>}
            </p>
          )}

          {/* Inline AI Explainability — "Why am I seeing this?" */}
          {isAction && !dense && (signal.ai_reasoning || signal.flag_reason) && (
            <div className="mt-1">
              <button
                onClick={(e) => { e.stopPropagation(); setShowExplain(!showExplain); }}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <HelpCircle className="h-3 w-3" />
                <span>Why am I seeing this?</span>
                <ChevronDown className={cn('h-3 w-3 transition-transform', showExplain && 'rotate-180')} />
              </button>
              
              <AnimatePresence>
                {showExplain && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 rounded-lg bg-hero-purple-soft/30 border border-hero-purple/10 px-3 py-2.5 space-y-1.5">
                      {parseAIReasoning(signal.ai_reasoning, signal.flag_reason).map((point, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          {point.startsWith('⚠️') ? (
                            <AlertTriangle className="h-3 w-3 text-signal-amber shrink-0 mt-0.5" />
                          ) : i === 0 ? (
                            <TrendingUp className="h-3 w-3 text-hero-purple shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                          )}
                          <span className="text-muted-foreground leading-relaxed">
                            {point.replace('⚠️ ', '')}
                          </span>
                        </div>
                      ))}
                      {signal.confidence && (
                        <div className="flex items-center gap-2 pt-1 border-t border-border/50 mt-2">
                          <div className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            signal.confidence >= 80 ? 'bg-signal-green' : signal.confidence >= 50 ? 'bg-signal-amber' : 'bg-signal-red'
                          )} />
                          <span className="text-[10px] text-muted-foreground">
                            AI confidence: <span className="font-medium">{signal.confidence}%</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Workflow progress bar */}
          {(isProgress || isAction) && (
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center gap-0.5">
                {detailedWorkflow.labels.map((label, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-all',
                      i < detailedWorkflow.stage ? 'bg-foreground/50' : 'bg-secondary'
                    )}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{detailedWorkflow.currentLabel}</span>
                {detailedWorkflow.stage < detailedWorkflow.total && (
                  <span className="text-muted-foreground/60">Next: {detailedWorkflow.labels[detailedWorkflow.stage]}</span>
                )}
              </div>
            </div>
          )}

          {/* Completed — owner label */}
          {isCompleted && (
            <p className="text-[11px] text-muted-foreground">{ownerLabels[signal.status]}</p>
          )}

          {/* Due/overdue indicator */}
          {isAction && classified.dueLabel && (
            <span className="text-[10px] text-signal-red font-medium">{classified.dueLabel}</span>
          )}

          {/* AI confidence — secondary, only dense finance cards */}
          {dense && isAction && signal.confidence !== null && (
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className={cn(
                'h-1.5 w-1.5 rounded-full',
                signal.confidence >= 80 ? 'bg-signal-green' : signal.confidence >= 50 ? 'bg-signal-amber' : 'bg-signal-red'
              )} />
              AI confidence {signal.confidence}%
            </div>
          )}

          {/* Expandable detail on card tap */}
          {!isCompleted && expanded && signal.description && (
            <div className="text-xs text-muted-foreground bg-secondary/40 rounded-lg px-2.5 py-2 space-y-1 mt-1">
              <p>{signal.description}</p>
              {signal.funding && <p><span className="font-medium">Funding:</span> {signal.funding}</p>}
              {signal.location && <p><span className="font-medium">Location:</span> {signal.location}</p>}
              {signal.supplier_suggestion && <p><span className="font-medium">Suggested supplier:</span> {signal.supplier_suggestion} ({signal.supplier_confidence}%)</p>}
            </div>
          )}

          {/* Actions */}
          {actions && <div className={cn(dense ? 'mt-1' : 'mt-1.5')}>{actions}</div>}
        </div>
      </div>
    </div>
  );
};

export default PulseCard;
