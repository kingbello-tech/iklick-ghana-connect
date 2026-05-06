-- Allow all incident-managing roles to submit the resolution report (was previously closure-only)
DROP POLICY IF EXISTS "Authorized roles create closures" ON public.incident_closures;

CREATE POLICY "Resolution roles create closures"
ON public.incident_closures
FOR INSERT
TO authenticated
WITH CHECK (
  (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'network_engineer'::app_role)
    OR public.has_role(auth.uid(), 'support_agent'::app_role)
    OR public.has_role(auth.uid(), 'network_manager'::app_role)
    OR public.has_role(auth.uid(), 'client_experience'::app_role)
  )
  AND closed_by = auth.uid()
);