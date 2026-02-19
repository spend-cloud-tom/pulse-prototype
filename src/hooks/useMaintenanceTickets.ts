import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type MaintenanceTicket = Tables<'maintenance_tickets'>;
export type MaintenanceTicketInsert = TablesInsert<'maintenance_tickets'>;

export function useMaintenanceTickets() {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    const { data, error } = await supabase
      .from('maintenance_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tickets:', error);
    } else {
      setTickets(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTickets();

    const channel = supabase
      .channel('maintenance-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_tickets' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTickets(prev => [payload.new as MaintenanceTicket, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setTickets(prev => prev.map(t => t.id === (payload.new as MaintenanceTicket).id ? payload.new as MaintenanceTicket : t));
        } else if (payload.eventType === 'DELETE') {
          setTickets(prev => prev.filter(t => t.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchTickets]);

  const createTicket = useCallback(async (ticket: MaintenanceTicketInsert) => {
    const { data, error } = await supabase
      .from('maintenance_tickets')
      .insert(ticket)
      .select()
      .single();

    if (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
    return data;
  }, []);

  const updateTicket = useCallback(async (id: string, updates: Partial<MaintenanceTicket>) => {
    const { error } = await supabase
      .from('maintenance_tickets')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating ticket:', error);
      throw error;
    }
  }, []);

  return { tickets, loading, createTicket, updateTicket, refetch: fetchTickets };
}
