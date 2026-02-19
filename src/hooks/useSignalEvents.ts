import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SignalEvent {
  id: string;
  signal_id: string | null;
  event_type: 'created' | 'auto_resolved' | 'escalated' | 'approved' | 'rejected' | 'status_change' | 'assigned' | 'comment' | 'undo';
  actor_role: 'anouk' | 'jolanda' | 'rohan' | 'sarah' | 'ai' | 'system' | null;
  actor_name: string | null;
  previous_status: string | null;
  new_status: string | null;
  metadata: {
    title?: string;
    amount?: number;
    location?: string;
    confidence?: number;
    rule_applied?: string;
    time_saved_seconds?: number;
    [key: string]: any;
  };
  created_at: string;
}

// Demo events for when database is empty
const DEMO_EVENTS: SignalEvent[] = [
  {
    id: 'demo-evt-1',
    signal_id: 'demo-5',
    event_type: 'auto_resolved',
    actor_role: 'ai',
    actor_name: 'Pulse AI',
    previous_status: 'pending',
    new_status: 'auto-approved',
    metadata: { title: 'Cleaning supplies — Ward B', amount: 34.50, rule_applied: 'Under €50 threshold', time_saved_seconds: 180 },
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-evt-2',
    signal_id: 'demo-6',
    event_type: 'auto_resolved',
    actor_role: 'ai',
    actor_name: 'Pulse AI',
    previous_status: 'pending',
    new_status: 'auto-approved',
    metadata: { title: 'Coffee supplies — kitchen', amount: 28.90, rule_applied: 'Recurring order pattern', time_saved_seconds: 120 },
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-evt-3',
    signal_id: 'demo-1',
    event_type: 'escalated',
    actor_role: 'ai',
    actor_name: 'Pulse AI',
    previous_status: 'pending',
    new_status: 'pending',
    metadata: { title: 'Special bedding — non-contracted supplier', amount: 420.00, reason: 'Non-contracted supplier flagged' },
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-evt-4',
    signal_id: 'demo-7',
    event_type: 'status_change',
    actor_role: 'sarah',
    actor_name: 'Sarah',
    previous_status: 'approved',
    new_status: 'in-motion',
    metadata: { title: 'Wheelchair repair — room 12', amount: 85.00 },
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-evt-5',
    signal_id: 'demo-9',
    event_type: 'status_change',
    actor_role: 'system',
    actor_name: 'System',
    previous_status: 'awaiting-supplier',
    new_status: 'delivered',
    metadata: { title: 'Hand soap refill — all locations', amount: 42.00 },
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function useSignalEvents(limit = 50) {
  const [events, setEvents] = useState<SignalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    // Note: signal_events table types will be available after migration + type regeneration
    // Using type assertion until then
    const { data, error } = await (supabase as any)
      .from('signal_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching signal events:', error);
      // Use demo events as fallback
      setEvents(DEMO_EVENTS);
    } else if (!data || data.length === 0) {
      // Use demo events when database is empty
      setEvents(DEMO_EVENTS);
    } else {
      setEvents(data as SignalEvent[]);
    }
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    fetchEvents();

    // Subscribe to realtime events
    const channel = supabase
      .channel('signal-events-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'signal_events' }, (payload) => {
        const newEvent = payload.new as SignalEvent;
        setEvents(prev => [newEvent, ...prev].slice(0, limit));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchEvents, limit]);

  // Log an event manually (for client-side actions)
  const logEvent = useCallback(async (event: Omit<SignalEvent, 'id' | 'created_at'>) => {
    // Note: signal_events table types will be available after migration + type regeneration
    const { data, error } = await (supabase as any)
      .from('signal_events')
      .insert(event)
      .select()
      .single();

    if (error) {
      console.error('Error logging signal event:', error);
      // Optimistically add to local state for demo
      const demoEvent: SignalEvent = {
        ...event,
        id: `local-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      setEvents(prev => [demoEvent, ...prev].slice(0, limit));
      return demoEvent;
    }
    return data as SignalEvent;
  }, [limit]);

  // Get events for a specific time range (for timeline playback)
  const getEventsInRange = useCallback((startTime: Date, endTime: Date) => {
    return events.filter(e => {
      const eventTime = new Date(e.created_at);
      return eventTime >= startTime && eventTime <= endTime;
    });
  }, [events]);

  // Get recent activity summary
  const getActivitySummary = useCallback(() => {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentEvents = events.filter(e => new Date(e.created_at) >= last24h);

    return {
      total: recentEvents.length,
      autoResolved: recentEvents.filter(e => e.event_type === 'auto_resolved').length,
      approved: recentEvents.filter(e => e.event_type === 'approved').length,
      escalated: recentEvents.filter(e => e.event_type === 'escalated').length,
      timeSavedSeconds: recentEvents.reduce((sum, e) => sum + (e.metadata?.time_saved_seconds || 0), 0),
    };
  }, [events]);

  return { 
    events, 
    loading, 
    logEvent, 
    refetch: fetchEvents,
    getEventsInRange,
    getActivitySummary,
  };
}
