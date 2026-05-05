
-- Enable pg_cron for scheduled escalation
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Auto-escalation: any open incident past its SLA response time is escalated
CREATE OR REPLACE FUNCTION public.auto_escalate_stale_incidents()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  r RECORD;
BEGIN
  FOR r IN
    SELECT i.id, i.status, i.priority, i.assigned_to, i.created_at, p.response_time_minutes
    FROM public.incidents i
    JOIN public.sla_policies p ON p.priority = i.priority
    WHERE i.status = 'open'
      AND EXTRACT(EPOCH FROM (now() - i.created_at)) / 60 > p.response_time_minutes
  LOOP
    UPDATE public.incidents
    SET status = 'escalated', updated_at = now()
    WHERE id = r.id;

    INSERT INTO public.incident_history (incident_id, user_id, field_changed, old_value, new_value)
    VALUES (r.id, NULL, 'status', 'open', 'escalated');

    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

-- Schedule every 5 minutes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-escalate-stale-incidents') THEN
    PERFORM cron.schedule(
      'auto-escalate-stale-incidents',
      '*/5 * * * *',
      $cron$ SELECT public.auto_escalate_stale_incidents(); $cron$
    );
  END IF;
END $$;
