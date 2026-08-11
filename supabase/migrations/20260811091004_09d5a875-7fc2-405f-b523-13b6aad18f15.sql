
CREATE TABLE public.client_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_users TO authenticated;
GRANT ALL ON public.client_users TO service_role;

ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.client_id_for_user(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT client_id FROM public.client_users WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_client_user(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.client_users WHERE user_id = _user_id)
$$;

CREATE POLICY "Client users can view own link" ON public.client_users
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_any_role(auth.uid()));
CREATE POLICY "Admins manage client users" ON public.client_users
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_client_users_updated_at
  BEFORE UPDATE ON public.client_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Clients table: client users see only their own company
CREATE POLICY "Client users can view own company" ON public.clients
  FOR SELECT TO authenticated
  USING (id = public.client_id_for_user(auth.uid()));

-- Incidents: staff see all, client users see only their own company's incidents
DROP POLICY IF EXISTS "Authenticated users can view incidents" ON public.incidents;
CREATE POLICY "Staff and owning clients can view incidents" ON public.incidents
  FOR SELECT TO authenticated
  USING (
    public.has_any_role(auth.uid())
    OR (client_id IS NOT NULL AND client_id = public.client_id_for_user(auth.uid()))
  );

CREATE POLICY "Client users can log incidents" ON public.incidents
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND client_id IS NOT NULL
    AND client_id = public.client_id_for_user(auth.uid())
    AND assigned_to IS NULL
    AND status = 'open'::incident_status
    AND source = 'client_portal'
  );

-- Internal notes are staff-only
DROP POLICY IF EXISTS "Authenticated users can view notes" ON public.incident_notes;
CREATE POLICY "Staff can view notes" ON public.incident_notes
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

-- Staff directory is staff-only
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
CREATE POLICY "Staff can view profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()) OR user_id = auth.uid());
