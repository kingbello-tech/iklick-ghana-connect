DROP POLICY IF EXISTS "Authenticated view incident clients" ON public.incident_clients;
CREATE POLICY "Staff and linked clients view incident clients" ON public.incident_clients FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid()) OR client_id = public.client_id_for_user(auth.uid()));

DROP POLICY IF EXISTS "Staff and owning clients can view incidents" ON public.incidents;
CREATE POLICY "Staff and owning clients can view incidents" ON public.incidents FOR SELECT TO authenticated
USING (
  public.has_any_role(auth.uid())
  OR (client_id IS NOT NULL AND client_id = public.client_id_for_user(auth.uid()))
  OR EXISTS (SELECT 1 FROM public.incident_clients ic WHERE ic.incident_id = incidents.id AND ic.client_id = public.client_id_for_user(auth.uid()))
);