
-- Allow client_experience (and other can-close roles) to update incidents — needed to flip status to 'closed' after submitting a closure report.
CREATE POLICY "Closure-authorized roles can update incidents"
ON public.incidents
FOR UPDATE
TO authenticated
USING (public.can_close_incident(auth.uid()))
WITH CHECK (public.can_close_incident(auth.uid()));

-- Backfill INC-00060 which was closed by CX but blocked by RLS
UPDATE public.incidents
SET status = 'closed', closed_at = COALESCE(closed_at, now()), updated_at = now()
WHERE incident_number = 'INC-00060' AND status = 'resolved';

INSERT INTO public.incident_history (incident_id, user_id, field_changed, old_value, new_value)
SELECT id, NULL, 'status', 'resolved', 'closed'
FROM public.incidents WHERE incident_number = 'INC-00060';
