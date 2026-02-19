import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type DbSignal = Tables<'signals'>;
export type DbSignalInsert = TablesInsert<'signals'>;

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
    } else {
      setSignals(data || []);
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
