import { useState } from 'react';
import { Signal, ConfidenceLevel } from '@/data/types';
import { signalTypeConfig } from '@/data/mockData';
import { classifySignal, riskConfig, getWorkflowStage } from '@/lib/decisionTypes';
import PulseTypeIcon from '@/components/PulseTypeIcon';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

// Status labels
const statusLabels: Record<string, string> = {
  pending: 'New',
  'needs-clarity': 'Awaiting info',
  approved: 'Approved',
  'in-motion': 'In progress',
  'awaiting-supplier': 'Awaiting others',
  'auto-approved': 'Completed',
  delivered: 'Completed',
  closed: 'Completed',
  rejected: 'Rejected',
};

// Owner labels
const ownerLabels: Record<string, string> = {
  pending: 'Awaiting reviewer',
  'needs-clarity': 'Waiting for you',
  'in-motion': 'With procurement',
  'awaiting-supplier': 'With supplier',
  approved: 'Moving to procurement',
  'auto-approved': 'Auto-handled',
  delivered: 'Delivered',
  closed: 'Completed',
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

const PulseCard = ({ signal, variant = 'action', dense = false, onClick, actions }: PulseCardProps) => {
  const [expanded, setExpanded] = useState(false);
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
          {/* Header row — type, time, badges */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0">
              <PulseTypeIcon type={signal.signal_type} className="h-3 w-3 shrink-0" />
              <span className="font-medium uppercase tracking-wide">{typeInfo.label}</span>
              <span className="text-muted-foreground/60">·</span>
              <span className="shrink-0">{formatTimeAgo(signal.created_at)}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Status badge */}
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-0 bg-secondary text-muted-foreground font-medium">
                {statusLabels[signal.status] || signal.status}
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

          {/* 1-line AI reasoning — expandable */}
          {isAction && !dense && signal.ai_reasoning && (
            <p className="text-xs text-muted-foreground line-clamp-1">{signal.ai_reasoning}</p>
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
