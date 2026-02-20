import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type DbSignal = Tables<'signals'>;
export type DbSignalInsert = TablesInsert<'signals'>;

// Helper to create demo signal with all required fields
const createDemoSignal = (partial: {
  id: string;
  signal_number: number;
  title: string;
  description: string;
  amount: number;
  submitter_name: string;
  submitter_avatar?: string | null;
  location: string;
  category: string;
  signal_type: 'purchase' | 'maintenance' | 'incident' | 'shift-handover' | 'compliance' | 'event' | 'resource' | 'general';
  status: 'pending' | 'needs-clarity' | 'approved' | 'in-motion' | 'awaiting-supplier' | 'auto-approved' | 'delivered' | 'closed' | 'rejected';
  urgency: 'normal' | 'urgent' | 'critical';
  funding: string;
  ai_reasoning: string;
  confidence: number;
  flag_reason?: string | null;
  expected_date?: string | null;
  created_at: string;
  current_owner?: string | null;
  lifecycle_stage?: string | null;
  sla_hours?: number | null;
  escalated_at?: string | null;
}): DbSignal => {
  const base: DbSignal = {
    ...partial,
    submitter_avatar: partial.submitter_avatar ?? null,
    flag_reason: partial.flag_reason ?? null,
    expected_date: partial.expected_date ?? null,
    updated_at: new Date().toISOString(),
    attachments: null,
    bottleneck: null,
    confidence_level: partial.confidence >= 90 ? 'high' : partial.confidence >= 70 ? 'medium' : 'low',
    cost_comparison: null,
    supplier_confidence: null,
    supplier_suggestion: null,
  };
  // Accountability metadata (extended fields not yet in DB schema)
  return {
    ...base,
    current_owner: partial.current_owner ?? null,
    lifecycle_stage: partial.lifecycle_stage ?? null,
    sla_hours: partial.sla_hours ?? null,
    escalated_at: partial.escalated_at ?? null,
  } as DbSignal;
};

// Fallback demo signals for when database is empty — ensures demo always works
const DEMO_SIGNALS: DbSignal[] = [
  // Decision Pulses (need approval) - for Jolanda
  createDemoSignal({
    id: 'demo-1',
    signal_number: 1047,
    title: 'Special bedding — non-contracted supplier',
    description: 'Pressure-relief mattress for resident with bedsore risk. Requested from BedCare Direct (not contracted).',
    amount: 420.00,
    submitter_name: 'Sanjaya Kumar',
    location: 'Zonneweide',
    category: 'Medical Equipment',
    signal_type: 'purchase',
    status: 'pending',
    urgency: 'urgent',
    funding: 'Wlz',
    ai_reasoning: 'Non-contracted supplier flagged. Amount 34% above Ward C average. Similar spike in Oct 2024 was seasonal (winter bedding). Recommend requesting quote from contracted supplier MedSupply NL.',
    confidence: 78,
    flag_reason: 'Non-contracted supplier',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    current_owner: 'Finance',
    lifecycle_stage: 'requested',
    sla_hours: 24,
  }),
  createDemoSignal({
    id: 'demo-2',
    signal_number: 1046,
    title: 'Medical gloves — bulk order',
    description: 'Monthly restock of nitrile gloves for all wards. Standard order from MedSupply NL.',
    amount: 189.00,
    submitter_name: 'Tom Bakker',
    location: 'Zonneweide',
    category: 'Medical Supplies',
    signal_type: 'purchase',
    status: 'pending',
    urgency: 'normal',
    funding: 'Wlz',
    ai_reasoning: 'Recurring monthly order. Contracted supplier. Amount within historical range (avg €175-195). Auto-approval recommended.',
    confidence: 94,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  }),
  createDemoSignal({
    id: 'demo-3',
    signal_number: 1045,
    title: 'Office supplies — Staples NL',
    description: 'Printer paper, pens, and folders for admin office.',
    amount: 67.40,
    submitter_name: 'Marielle de Jong',
    location: 'Zonneweide',
    category: 'Office Supplies',
    signal_type: 'purchase',
    status: 'pending',
    urgency: 'normal',
    funding: 'General',
    ai_reasoning: 'Standard office restock. Contracted supplier. Under €100 threshold. Auto-approval recommended.',
    confidence: 96,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  }),
  // Exception Pulses (need reconciliation) - for Rohan
  createDemoSignal({
    id: 'demo-4',
    signal_number: 1040,
    title: 'Invoice variance — MedSupply NL',
    description: 'Invoice INV-44918 is €4.80 over PO amount (+2.5% variance).',
    amount: 194.30,
    submitter_name: 'System',
    location: 'Zonneweide',
    category: 'Medical Supplies',
    signal_type: 'purchase',
    status: 'needs-clarity',
    urgency: 'normal',
    funding: 'Wlz',
    ai_reasoning: 'Variance within vendor historical pattern (avg 2.2%). Price increase likely due to supplier cost adjustment. Recommend approval with note.',
    confidence: 87,
    flag_reason: 'Invoice variance +2.5%',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    current_owner: 'Finance',
    lifecycle_stage: 'requested',
    sla_hours: 24,
  }),
  // Auto-resolved Pulses (AI handled) - shows orchestration power
  createDemoSignal({
    id: 'demo-5',
    signal_number: 1044,
    title: 'Cleaning supplies — Ward B',
    description: 'Blue wipes and hand sanitizer for Ward B hygiene station.',
    amount: 34.50,
    submitter_name: 'Anouk van Dijk',
    submitter_avatar: '/avatars/anouk.jpg',
    location: 'Zonneweide',
    category: 'Hygiene & Cleaning',
    signal_type: 'purchase',
    status: 'auto-approved',
    urgency: 'normal',
    funding: 'Wlz',
    ai_reasoning: 'Under €50 threshold. Matched to Ward B hygiene budget. GL code 4210 auto-assigned. Routed to procurement.',
    confidence: 98,
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  }),
  createDemoSignal({
    id: 'demo-6',
    signal_number: 1043,
    title: 'Coffee supplies — kitchen',
    description: 'Coffee beans and filters for staff kitchen.',
    amount: 28.90,
    submitter_name: 'Geert-Jan Visser',
    location: 'Zonneweide',
    category: 'Food & Beverages',
    signal_type: 'purchase',
    status: 'auto-approved',
    urgency: 'normal',
    funding: 'General',
    ai_reasoning: 'Recurring weekly order. Under threshold. Auto-approved and sent to procurement.',
    confidence: 99,
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  }),
  // In-progress Pulses - for Anouk to see her requests moving
  createDemoSignal({
    id: 'demo-7',
    signal_number: 1042,
    title: 'Wheelchair repair — room 12',
    description: 'Left wheel bearing needs replacement. Resident mobility affected.',
    amount: 85.00,
    submitter_name: 'Anouk van Dijk',
    submitter_avatar: '/avatars/anouk.jpg',
    location: 'Zonneweide',
    category: 'Equipment Repair',
    signal_type: 'maintenance',
    status: 'in-motion',
    urgency: 'normal',
    funding: 'Wlz',
    ai_reasoning: 'Maintenance ticket created. Contractor TechCare scheduled for tomorrow 10:00.',
    confidence: 95,
    expected_date: 'Tomorrow 10:00',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    current_owner: 'Maintenance',
    lifecycle_stage: 'in-progress',
    sla_hours: 48,
  }),
  createDemoSignal({
    id: 'demo-8',
    signal_number: 1041,
    title: 'Incontinence supplies order',
    description: 'Monthly restock for all residents. Order placed with MedSupply NL.',
    amount: 340.00,
    submitter_name: 'Richard Smit',
    location: 'Zonneweide',
    category: 'Medical Supplies',
    signal_type: 'purchase',
    status: 'awaiting-supplier',
    urgency: 'normal',
    funding: 'Wlz',
    ai_reasoning: 'Order confirmed by MedSupply NL. Tracking: NL-PKG-44921. ETA: Tomorrow 10:00.',
    confidence: 100,
    expected_date: 'Tomorrow 10:00',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  }),
  // Delivered/Completed - shows full cycle
  createDemoSignal({
    id: 'demo-9',
    signal_number: 1039,
    title: 'Hand soap refill — all locations',
    description: 'Bulk order delivered and distributed.',
    amount: 42.00,
    submitter_name: 'Anouk van Dijk',
    submitter_avatar: '/avatars/anouk.jpg',
    location: 'Zonneweide',
    category: 'Hygiene & Cleaning',
    signal_type: 'purchase',
    status: 'delivered',
    urgency: 'normal',
    funding: 'General',
    ai_reasoning: 'Delivered and confirmed. Invoice matched. GL posted.',
    confidence: 100,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  }),
];

export function useSignals() {
  const [signals, setSignals] = useState<DbSignal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSignals = useCallback(async () => {
    const { data, error } = await supabase
      .from('signals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching signals:', error);
      // Use demo signals as fallback on error
      setSignals(DEMO_SIGNALS);
    } else if (!data || data.length === 0) {
      // Use demo signals when database is empty
      setSignals(DEMO_SIGNALS);
    } else {
      setSignals(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSignals();

    const channel = supabase
      .channel('signals-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'signals' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setSignals(prev => [payload.new as DbSignal, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setSignals(prev => prev.map(s => s.id === (payload.new as DbSignal).id ? payload.new as DbSignal : s));
        } else if (payload.eventType === 'DELETE') {
          setSignals(prev => prev.filter(s => s.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchSignals]);

  const addSignal = useCallback(async (signal: DbSignalInsert) => {
    const { data, error } = await supabase
      .from('signals')
      .insert(signal)
      .select()
      .single();

    if (error) {
      console.error('Error adding signal:', error);
      throw error;
    }
    return data;
  }, []);

  const updateSignal = useCallback(async (id: string, updates: Partial<DbSignal>) => {
    const { error } = await supabase
      .from('signals')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating signal:', error);
      throw error;
    }
  }, []);

  return { signals, loading, addSignal, updateSignal, refetch: fetchSignals };
}
