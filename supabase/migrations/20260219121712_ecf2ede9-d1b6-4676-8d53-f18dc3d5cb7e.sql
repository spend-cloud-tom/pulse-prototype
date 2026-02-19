
-- Signal statuses and types as enums
CREATE TYPE public.signal_status AS ENUM (
  'pending', 'approved', 'auto-approved', 'needs-clarity', 
  'rejected', 'in-motion', 'delivered', 'awaiting-supplier', 'closed'
);

CREATE TYPE public.signal_type AS ENUM (
  'purchase', 'maintenance', 'incident', 'shift-handover', 
  'compliance', 'event', 'resource', 'general'
);

CREATE TYPE public.urgency_level AS ENUM ('normal', 'urgent', 'critical');

CREATE TYPE public.confidence_level AS ENUM ('high', 'medium', 'low');

-- Core signals table
CREATE TABLE public.signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_number SERIAL,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(10,2) DEFAULT 0,
  submitter_name TEXT NOT NULL,
  submitter_avatar TEXT,
  location TEXT NOT NULL DEFAULT 'Zonneweide',
  category TEXT DEFAULT 'General',
  signal_type public.signal_type NOT NULL DEFAULT 'general',
  urgency public.urgency_level NOT NULL DEFAULT 'normal',
  funding TEXT DEFAULT 'General',
  status public.signal_status NOT NULL DEFAULT 'pending',
  confidence INTEGER DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
  confidence_level public.confidence_level DEFAULT 'medium',
  flag_reason TEXT,
  ai_reasoning TEXT,
  supplier_suggestion TEXT,
  supplier_confidence INTEGER,
  cost_comparison TEXT,
  expected_date TEXT,
  bottleneck TEXT,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Maintenance tickets linked to signals
CREATE TABLE public.maintenance_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID REFERENCES public.signals(id) ON DELETE CASCADE NOT NULL,
  contractor_name TEXT,
  contractor_phone TEXT,
  scheduled_date DATE,
  completion_date DATE,
  priority public.urgency_level NOT NULL DEFAULT 'normal',
  location TEXT NOT NULL,
  room_or_area TEXT,
  issue_description TEXT NOT NULL,
  resolution_notes TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in-progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_tickets ENABLE ROW LEVEL SECURITY;

-- For now, allow all access (no auth yet — prototype phase)
-- These are permissive policies for prototyping; will tighten with auth later
CREATE POLICY "Allow all read signals" ON public.signals FOR SELECT USING (true);
CREATE POLICY "Allow all insert signals" ON public.signals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update signals" ON public.signals FOR UPDATE USING (true);
CREATE POLICY "Allow all delete signals" ON public.signals FOR DELETE USING (true);

CREATE POLICY "Allow all read maintenance" ON public.maintenance_tickets FOR SELECT USING (true);
CREATE POLICY "Allow all insert maintenance" ON public.maintenance_tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update maintenance" ON public.maintenance_tickets FOR UPDATE USING (true);
CREATE POLICY "Allow all delete maintenance" ON public.maintenance_tickets FOR DELETE USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_signals_updated_at
  BEFORE UPDATE ON public.signals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_tickets_updated_at
  BEFORE UPDATE ON public.maintenance_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for signals
ALTER PUBLICATION supabase_realtime ADD TABLE public.signals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_tickets;
