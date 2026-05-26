
CREATE TABLE IF NOT EXISTS public.incident_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (incident_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_incident_clients_incident ON public.incident_clients(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_clients_client ON public.incident_clients(client_id);

ALTER TABLE public.incident_clients ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read
CREATE POLICY "Authenticated view incident clients" ON public.incident_clients
FOR SELECT TO authenticated USING (true);

-- Only incident creators can insert
CREATE POLICY "Staff manage incident clients" ON public.incident_clients
FOR INSERT TO authenticated WITH CHECK (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'technology_manager') OR has_role(auth.uid(),'technology_engineer')
  OR has_role(auth.uid(),'network_manager') OR has_role(auth.uid(),'network_engineer')
);

-- Only admins and managers can delete
CREATE POLICY "Staff delete incident clients" ON public.incident_clients
FOR DELETE TO authenticated USING (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'technology_manager') OR has_role(auth.uid(),'network_manager')
);
