DROP POLICY IF EXISTS "Staff can create notes" ON public.incident_notes;

CREATE POLICY "Staff can create notes"
ON public.incident_notes
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'network_engineer'::app_role)
  OR public.has_role(auth.uid(), 'support_agent'::app_role)
  OR public.has_role(auth.uid(), 'client_experience'::app_role)
);