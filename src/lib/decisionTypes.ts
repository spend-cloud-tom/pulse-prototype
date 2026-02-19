import { Signal } from '@/data/types';

// Decision type classification — system-wide
export type DecisionType = 'approval' | 'exception' | 'alert';

export interface ClassifiedSignal extends Signal {
  decisionType: DecisionType;
  riskLevel: 'low' | 'medium' | 'high';
  dueLabel: string | null;
}

// Classify a signal into approval / exception / alert
export function classifySignal(signal: Signal): ClassifiedSignal {
  let decisionType: DecisionType = 'approval';

  // Exceptions: compliance, mismatches, flag_reason present
  if (
    signal.signal_type === 'compliance' ||
    signal.flag_reason ||
    (signal.confidence !== null && signal.confidence < 60)
  ) {
    decisionType = 'exception';
  }

  // Alerts: incidents, overdue items, shift-handover
  if (
    signal.signal_type === 'incident' ||
    signal.signal_type === 'shift-handover' ||
    signal.bottleneck
  ) {
    decisionType = 'alert';
  }

  // Risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  const amt = signal.amount || 0;
  if (signal.urgency === 'critical' || amt > 250) riskLevel = 'high';
  else if (signal.urgency === 'urgent' || amt > 100) riskLevel = 'medium';

  // Due label
  let dueLabel: string | null = null;
  if (signal.expected_date) {
    dueLabel = `Due: ${signal.expected_date}`;
  }
  if (signal.urgency === 'critical') {
    dueLabel = 'Overdue';
  }

  return { ...signal, decisionType, riskLevel, dueLabel };
}

// Classify a batch and group by type
export function classifyAndGroup(signals: Signal[]) {
  const classified = signals.map(classifySignal);
  return {
    approvals: classified.filter(s => s.decisionType === 'approval'),
    exceptions: classified.filter(s => s.decisionType === 'exception'),
    alerts: classified.filter(s => s.decisionType === 'alert'),
    all: classified,
  };
}

// Workflow stages
export function getWorkflowStage(status: string): { stage: number; total: number; label: string } {
  const stages: Record<string, { stage: number; total: number; label: string }> = {
    pending: { stage: 1, total: 4, label: 'Submitted' },
    'needs-clarity': { stage: 1, total: 4, label: 'Needs clarification' },
    approved: { stage: 2, total: 4, label: 'Approved' },
    'in-motion': { stage: 3, total: 4, label: 'Processing' },
    'awaiting-supplier': { stage: 3, total: 4, label: 'With vendor' },
    delivered: { stage: 4, total: 4, label: 'Delivered' },
    closed: { stage: 4, total: 4, label: 'Closed' },
    'auto-approved': { stage: 4, total: 4, label: 'Auto-handled' },
    rejected: { stage: 4, total: 4, label: 'Rejected' },
  };
  return stages[status] || { stage: 1, total: 4, label: status };
}

// Risk badge config
export const riskConfig = {
  low: { label: 'Low risk', style: 'bg-secondary text-muted-foreground' },
  medium: { label: 'Medium risk', style: 'bg-signal-amber-bg text-signal-amber' },
  high: { label: 'High risk', style: 'bg-signal-red-bg text-signal-red' },
};
