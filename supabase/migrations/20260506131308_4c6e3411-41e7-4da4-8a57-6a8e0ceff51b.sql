
-- Table to store closure reports for resolved incidents
CREATE TABLE public.incident_closures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID NOT NULL UNIQUE,
  root_cause TEXT NOT NULL,
  resolution TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  closed_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.incident_closures ENABLE ROW LEVEL SECURITY;

-- Helper function: who is allowed to close incidents
CREATE OR REPLACE FUNCTION public.can_close_incident(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin', 'client_experience', 'network_manager')
  )
$$;

CREATE POLICY "Authenticated view closures"
ON public.incident_closures FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authorized roles create closures"
ON public.incident_closures FOR INSERT
TO authenticated
WITH CHECK (public.can_close_incident(auth.uid()) AND closed_by = auth.uid());

CREATE POLICY "Admins delete closures"
ON public.incident_closures FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
