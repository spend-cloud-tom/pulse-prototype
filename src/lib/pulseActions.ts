// PULSE ACTION LANGUAGE — Unified verbs for state transitions
// All actions are Pulse-centric, not module-specific

export const pulseActions = {
  // Primary state transitions
  assignOwner: 'Assign Owner',           // replaces "Assign supplier", "Assign contractor"
  advancePulse: 'Advance Pulse',         // replaces "Generate Auto-PO", "Process"
  escalatePulse: 'Escalate Pulse',       // replaces "Escalate"
  resolvePulse: 'Resolve Pulse',         // replaces "Mark Complete", "Close"
  blockPulse: 'Mark Blocked',            // new - explicit blocked state
  
  // Secondary actions
  requestInfo: 'Request Info',           // replaces "Needs clarity"
  approvePulse: 'Approve',               // financial approval (stays as-is, it's clear)
  rejectPulse: 'Reject',                 // rejection (stays as-is)
  
  // Tooltips for actions
  tooltips: {
    assignOwner: 'Assign someone to handle this',
    advancePulse: 'Move to the next stage',
    escalatePulse: 'Escalate to a manager',
    resolvePulse: 'Mark as resolved',
    blockPulse: 'Mark as blocked',
    requestInfo: 'Request additional information',
    approvePulse: 'Approve this item',
    rejectPulse: 'Reject this item',
  },
} as const;

// FLOW STATES — The 5 canonical states
export const pipelineStates = [
  { key: 'needs-action', label: 'Needs Action', icon: '🔴', color: 'signal-red' },
  { key: 'in-motion', label: 'In Motion', icon: '🟡', color: 'signal-amber' },
  { key: 'blocked', label: 'Blocked', icon: '⚫', color: 'slate' },
  { key: 'auto-handled', label: 'Auto-Handled', icon: '🟣', color: 'hero-purple' },
  { key: 'resolved', label: 'Resolved', icon: '🟢', color: 'signal-green' },
] as const;

export type PipelineStateKey = typeof pipelineStates[number]['key'];

// Helper to get pipeline state config
export const getPipelineState = (key: string) => 
  pipelineStates.find(s => s.key === key) || pipelineStates[0];
