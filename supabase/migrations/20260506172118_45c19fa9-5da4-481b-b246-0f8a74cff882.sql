CREATE POLICY "CX and managers can create history"
ON public.incident_history
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'client_experience'::app_role)
  OR public.has_role(auth.uid(), 'network_manager'::app_role)
);