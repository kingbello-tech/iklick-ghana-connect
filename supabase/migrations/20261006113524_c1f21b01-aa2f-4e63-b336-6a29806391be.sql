GRANT EXECUTE ON FUNCTION public.recurring_issue_patterns(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recurring_pattern_incidents(uuid, uuid, text, text, integer) TO authenticated;
DROP POLICY IF EXISTS "Staff can update incident closures" ON public.incident_closures;
CREATE POLICY "Staff can update incident closures" ON public.incident_closures FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
GRANT UPDATE ON public.incident_closures TO authenticated;