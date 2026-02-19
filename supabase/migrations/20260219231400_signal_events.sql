-- Signal events table for temporal playback and real-time presence
-- Tracks all state changes for signals to enable "time travel" view

CREATE TABLE public.signal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID REFERENCES public.signals(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created', 'auto_resolved', 'escalated', 'approved', 'rejected', 
    'status_change', 'assigned', 'comment', 'undo'
  )),
  actor_role TEXT CHECK (actor_role IN ('anouk', 'jolanda', 'rohan', 'sarah', 'ai', 'system')),
  actor_name TEXT,
  previous_status TEXT,
  new_status TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient timeline queries
CREATE INDEX idx_signal_events_created_at ON public.signal_events(created_at DESC);
CREATE INDEX idx_signal_events_signal_id ON public.signal_events(signal_id);

-- Enable RLS (permissive for prototype)
ALTER TABLE public.signal_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read signal_events" ON public.signal_events FOR SELECT USING (true);
CREATE POLICY "Allow all insert signal_events" ON public.signal_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update signal_events" ON public.signal_events FOR UPDATE USING (true);
CREATE POLICY "Allow all delete signal_events" ON public.signal_events FOR DELETE USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.signal_events;

-- Trigger to auto-create event when signal status changes
CREATE OR REPLACE FUNCTION public.log_signal_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.signal_events (
      signal_id, 
      event_type, 
      actor_role,
      previous_status, 
      new_status,
      metadata
    ) VALUES (
      NEW.id,
      CASE 
        WHEN NEW.status = 'auto-approved' THEN 'auto_resolved'
        WHEN NEW.status = 'approved' THEN 'approved'
        WHEN NEW.status = 'rejected' THEN 'rejected'
        ELSE 'status_change'
      END,
      'system',
      OLD.status,
      NEW.status,
      jsonb_build_object('title', NEW.title, 'amount', NEW.amount)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER signal_status_change_trigger
  AFTER UPDATE ON public.signals
  FOR EACH ROW EXECUTE FUNCTION public.log_signal_status_change();

-- Trigger to log signal creation
CREATE OR REPLACE FUNCTION public.log_signal_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.signal_events (
    signal_id, 
    event_type, 
    actor_role,
    actor_name,
    new_status,
    metadata
  ) VALUES (
    NEW.id,
    'created',
    'system',
    NEW.submitter_name,
    NEW.status,
    jsonb_build_object('title', NEW.title, 'amount', NEW.amount, 'location', NEW.location)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER signal_created_trigger
  AFTER INSERT ON public.signals
  FOR EACH ROW EXECUTE FUNCTION public.log_signal_created();
