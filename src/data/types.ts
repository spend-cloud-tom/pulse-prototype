export type Role = 'anouk' | 'rohan' | 'sarah' | 'jolanda';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

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

export type SignalCategory = 
  | 'purchase'
  | 'maintenance'
  | 'incident'
  | 'shift-handover'
  | 'compliance'
  | 'event'
  | 'resource'
  | 'general';

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
}

export interface UserProfile {
  id: Role;
  name: string;
  role: string;
  focus: string;
  avatar: string;
  bannerMessage: string;
}
