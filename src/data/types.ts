export type Role = 'anouk' | 'rohan' | 'sarah' | 'jolanda';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

// PULSE STATE MODEL — The unified state machine for all Pulses
// Every item in the system is a Pulse moving through these states
export type PulseState = 
  | 'needs-action'      // 🔴 Requires human decision/input
  | 'in-motion'         // 🟡 Being processed, moving forward
  | 'blocked'           // ⚫ Stuck, waiting on external factor
  | 'auto-handled'      // 🟣 AI resolved without human intervention
  | 'resolved';         // 🟢 Complete, no further action needed

// Legacy status mapping (for DB compatibility)
export type SignalStatus = 
  | 'pending' 
  | 'approved' 
  | 'auto-approved' 
  | 'needs-clarity' 
  | 'rejected' 
  | 'in-motion' 
  | 'delivered' 
  | 'awaiting-supplier'
  | 'closed';

// Map legacy status to unified PulseState
export const statusToPulseState: Record<SignalStatus, PulseState> = {
  'pending': 'needs-action',
  'needs-clarity': 'needs-action',
  'approved': 'in-motion',
  'in-motion': 'in-motion',
  'awaiting-supplier': 'blocked',
  'auto-approved': 'auto-handled',
  'delivered': 'resolved',
  'closed': 'resolved',
  'rejected': 'resolved',
};

// PULSE TYPE — What kind of operational signal is this?
// All are Pulses, just different flavors
export type PulseType = 
  | 'purchase'
  | 'maintenance'
  | 'incident'
  | 'shift-handover'
  | 'compliance'
  | 'event'
  | 'resource'
  | 'general';

// TYPE-DEPENDENT LIFECYCLES — Each Pulse type has its own workflow
export type MaintenanceLifecycle = 'logged' | 'assigned' | 'in-progress' | 'resolved';
export type PurchaseLifecycle = 'requested' | 'approved' | 'ordered' | 'delivered' | 'reconciled';
export type IncidentLifecycle = 'logged' | 'reviewed' | 'actioned' | 'closed';
export type InformationalLifecycle = 'sent' | 'acknowledged';
export type ComplianceLifecycle = 'flagged' | 'under-review' | 'resolved';
export type EventLifecycle = 'planned' | 'confirmed' | 'in-progress' | 'completed';
export type ResourceLifecycle = 'requested' | 'approved' | 'allocated' | 'closed';

// Union of all lifecycle stages
export type LifecycleStage = 
  | MaintenanceLifecycle 
  | PurchaseLifecycle 
  | IncidentLifecycle 
  | InformationalLifecycle
  | ComplianceLifecycle
  | EventLifecycle
  | ResourceLifecycle;

// Legacy alias for backward compatibility
export type SignalCategory = PulseType;

export type UrgencyLevel = 'normal' | 'urgent' | 'critical';

// Signal type now matches the DB schema (snake_case fields)
// We use a mapped type for UI compatibility
export interface Signal {
  id: string;
  signal_number: number;
  title: string;
  description: string | null;
  amount: number | null;
  submitter_name: string;
  submitter_avatar: string | null;
  location: string;
  category: string | null;
  signal_type: SignalCategory;
  urgency: UrgencyLevel;
  funding: string | null;
  status: SignalStatus;
  confidence: number | null;
  confidence_level: ConfidenceLevel | null;
  flag_reason: string | null;
  ai_reasoning: string | null;
  supplier_suggestion: string | null;
  supplier_confidence: number | null;
  cost_comparison: string | null;
  expected_date: string | null;
  bottleneck: string | null;
  attachments: string[] | null;
  created_at: string;
  updated_at: string;
  // ACCOUNTABILITY METADATA — Who owns this Pulse?
  current_owner: string | null;       // Current responsible party (role or name)
  lifecycle_stage: string | null;     // Type-specific lifecycle stage
  sla_hours: number | null;           // SLA in hours (null = no SLA)
  escalated_at: string | null;        // When was this escalated?
}

export interface UserProfile {
  id: Role;
  name: string;
  role: string;
  focus: string;
  avatar: string;
  bannerMessage: string;
}
