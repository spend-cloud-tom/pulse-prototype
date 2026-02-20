import { Signal } from '@/data/types';

// Decision type classification — system-wide
export type DecisionType = 'approval' | 'exception' | 'alert';

// DECISION LAYER — For Jolanda's Decision Cockpit
// Layer 1: Human Judgment Required (financial decisions)
// Layer 2: Exceptions & Risk Alerts (anomalies, compliance)
// Layer 3: Informational (clinical handovers, awareness-only)
export type DecisionLayer = 'judgment' | 'exception' | 'informational';

// URGENCY HIERARCHY — Visual differentiation
export type UrgencyTier = 'critical' | 'high' | 'normal';

// SIGNAL DOMAIN — Separates financial from clinical
export type SignalDomain = 'financial' | 'clinical' | 'operational';

export interface ClassifiedSignal extends Signal {
  decisionType: DecisionType;
  riskLevel: 'low' | 'medium' | 'high';
  dueLabel: string | null;
  // New fields for Decision Cockpit
  decisionLayer: DecisionLayer;
  urgencyTier: UrgencyTier;
  signalDomain: SignalDomain;
  financialExposure: number; // €0 if not financial
  requiresManagerApproval: boolean;
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

  // === NEW: Decision Cockpit Classification ===
  
  // Signal Domain — What type of decision is this?
  let signalDomain: SignalDomain = 'operational';
  if (signal.signal_type === 'purchase' || (amt > 0)) {
    signalDomain = 'financial';
  } else if (
    signal.signal_type === 'incident' ||
    signal.signal_type === 'shift-handover'
  ) {
    signalDomain = 'clinical';
  }

  // Decision Layer — Where should this appear in the cockpit?
  let decisionLayer: DecisionLayer = 'informational';
  
  // Layer 1: Judgment — Financial decisions requiring manager approval
  const requiresManagerApproval = 
    signalDomain === 'financial' && 
    (amt > 100 || !!signal.flag_reason || signal.funding === 'uncertain');
  
  if (requiresManagerApproval) {
    decisionLayer = 'judgment';
  }
  // Layer 2: Exception — Anomalies, compliance, pattern alerts
  else if (
    signal.signal_type === 'compliance' ||
    signal.flag_reason?.includes('Anomaly') ||
    signal.flag_reason?.includes('pattern') ||
    (signal.confidence !== null && signal.confidence < 70)
  ) {
    decisionLayer = 'exception';
  }
  // Layer 3: Informational — Clinical handovers, awareness-only
  // (default)

  // Urgency Tier — Visual hierarchy
  let urgencyTier: UrgencyTier = 'normal';
  if (signal.urgency === 'critical' || riskLevel === 'high') {
    urgencyTier = 'critical';
  } else if (signal.urgency === 'urgent' || riskLevel === 'medium') {
    urgencyTier = 'high';
  }

  // Financial Exposure — For summary calculations
  const financialExposure = signalDomain === 'financial' ? amt : 0;

  return { 
    ...signal, 
    decisionType, 
    riskLevel, 
    dueLabel,
    decisionLayer,
    urgencyTier,
    signalDomain,
    financialExposure,
    requiresManagerApproval,
  };
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

// === NEW: Decision Cockpit Grouping ===
// Groups signals by layer for Jolanda's 3-layer view
export function groupByDecisionLayer(signals: Signal[]) {
  const classified = signals.map(classifySignal);
  
  // Layer 1: Human Judgment Required (max 3-5 visible)
  const judgmentPulses = classified
    .filter(s => s.decisionLayer === 'judgment')
    .sort((a, b) => {
      // Sort by urgency tier, then by amount
      const tierOrder: Record<UrgencyTier, number> = { critical: 0, high: 1, normal: 2 };
      const tierDiff = tierOrder[a.urgencyTier] - tierOrder[b.urgencyTier];
      if (tierDiff !== 0) return tierDiff;
      return (b.financialExposure || 0) - (a.financialExposure || 0);
    });

  // Layer 2: Exceptions & Risk Alerts
  const exceptionPulses = classified
    .filter(s => s.decisionLayer === 'exception')
    .sort((a, b) => {
      const tierOrder: Record<UrgencyTier, number> = { critical: 0, high: 1, normal: 2 };
      return tierOrder[a.urgencyTier] - tierOrder[b.urgencyTier];
    });

  // Layer 3: Informational (clinical, handovers, awareness)
  const informationalPulses = classified
    .filter(s => s.decisionLayer === 'informational');

  // Calculate totals
  const totalFinancialExposure = judgmentPulses.reduce(
    (sum, s) => sum + s.financialExposure, 0
  );

  return {
    judgment: judgmentPulses,
    exceptions: exceptionPulses,
    informational: informationalPulses,
    all: classified,
    stats: {
      judgmentCount: judgmentPulses.length,
      exceptionCount: exceptionPulses.length,
      informationalCount: informationalPulses.length,
      totalFinancialExposure,
      criticalCount: classified.filter(s => s.urgencyTier === 'critical').length,
    },
  };
}

// Urgency tier config for visual styling
// Uses action-state colors: risk (red) for critical, blocked (amber) for high
export const urgencyTierConfig: Record<UrgencyTier, { label: string; dotColor: string; bgColor: string; textColor: string }> = {
  critical: { 
    label: 'Critical', 
    dotColor: 'bg-state-risk', 
    bgColor: 'bg-state-risk-bg', 
    textColor: 'text-state-risk' 
  },
  high: { 
    label: 'High', 
    dotColor: 'bg-state-blocked', 
    bgColor: 'bg-state-blocked-bg', 
    textColor: 'text-state-blocked' 
  },
  normal: { 
    label: 'Normal', 
    dotColor: 'bg-muted-foreground', 
    bgColor: 'bg-secondary', 
    textColor: 'text-muted-foreground' 
  },
};

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
// Uses action-state colors: risk (red) reserved for genuine risk only
export const riskConfig = {
  low: { label: 'Low risk', style: 'bg-secondary text-muted-foreground' },
  medium: { label: 'Medium risk', style: 'bg-state-blocked-bg text-state-blocked' },
  high: { label: 'High risk', style: 'bg-state-risk-bg text-state-risk' },
};
