
-- Service type enum
CREATE TYPE public.service_type AS ENUM ('home', 'enterprise');

-- Clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  location TEXT,
  service_type service_type NOT NULL DEFAULT 'home',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- All authenticated can view
CREATE POLICY "Authenticated users can view clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (true);

-- Agents, engineers, admins can insert
CREATE POLICY "Staff can create clients"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'network_engineer') OR
    public.has_role(auth.uid(), 'support_agent')
  );

-- Agents, engineers, admins can update
CREATE POLICY "Staff can update clients"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'network_engineer') OR
    public.has_role(auth.uid(), 'support_agent')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'network_engineer') OR
    public.has_role(auth.uid(), 'support_agent')
  );

-- Only admins can delete
CREATE POLICY "Admins can delete clients"
  ON public.clients FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
