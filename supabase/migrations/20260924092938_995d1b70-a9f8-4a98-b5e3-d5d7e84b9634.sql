ALTER TABLE public.incidents
  ADD COLUMN IF NOT EXISTS paused_at timestamptz,
  ADD COLUMN IF NOT EXISTS paused_by uuid,
  ADD COLUMN IF NOT EXISTS pause_reason text,
  ADD COLUMN IF NOT EXISTS total_paused_minutes integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.can_pause_incident(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id,'admin') OR public.has_role(_user_id,'technology_manager') OR public.has_role(_user_id,'network_manager')
$$;

CREATE OR REPLACE FUNCTION public.pause_incident(_incident_id uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_inc public.incidents;
BEGIN
  IF NOT public.can_pause_incident(auth.uid()) THEN RAISE EXCEPTION 'Only Technology or Network managers can pause tickets'; END IF;
  IF coalesce(trim(_reason),'') = '' THEN RAISE EXCEPTION 'A reason is required'; END IF;
  SELECT * INTO v_inc FROM public.incidents WHERE id = _incident_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Incident not found'; END IF;
  IF v_inc.paused_at IS NOT NULL THEN RAISE EXCEPTION 'Ticket is already paused'; END IF;
  IF v_inc.status IN ('resolved','closed') THEN RAISE EXCEPTION 'Cannot pause a resolved or closed ticket'; END IF;
  UPDATE public.incidents SET paused_at = now(), paused_by = auth.uid(), pause_reason = trim(_reason), updated_at = now() WHERE id = _incident_id;
  INSERT INTO public.incident_history (incident_id, user_id, field_changed, old_value, new_value)
  VALUES (_incident_id, auth.uid(), 'sla_paused', NULL, trim(_reason));
END $$;

CREATE OR REPLACE FUNCTION public.resume_incident(_incident_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_inc public.incidents; v_mins integer;
BEGIN
  IF NOT public.can_pause_incident(auth.uid()) THEN RAISE EXCEPTION 'Only Technology or Network managers can resume tickets'; END IF;
  SELECT * INTO v_inc FROM public.incidents WHERE id = _incident_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Incident not found'; END IF;
  IF v_inc.paused_at IS NULL THEN RAISE EXCEPTION 'Ticket is not paused'; END IF;
  v_mins := GREATEST(0, CEIL(EXTRACT(EPOCH FROM (now() - v_inc.paused_at)) / 60))::int;
  UPDATE public.incidents SET
    paused_at = NULL, paused_by = NULL, pause_reason = NULL,
    total_paused_minutes = total_paused_minutes + v_mins,
    due_at = CASE WHEN due_at IS NULL THEN NULL ELSE due_at + make_interval(mins => v_mins) END,
    updated_at = now()
  WHERE id = _incident_id;
  INSERT INTO public.incident_history (incident_id, user_id, field_changed, old_value, new_value)
  VALUES (_incident_id, auth.uid(), 'sla_resumed', v_inc.pause_reason, v_mins || ' min paused');
END $$;

REVOKE EXECUTE ON FUNCTION public.pause_incident(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.resume_incident(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pause_incident(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resume_incident(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_pause_incident(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.auto_escalate_stale_incidents()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count integer := 0; r RECORD;
BEGIN
  FOR r IN
    SELECT i.id FROM public.incidents i
    JOIN public.sla_policies p ON p.priority = i.priority
    WHERE i.status = 'open' AND i.paused_at IS NULL
      AND (EXTRACT(EPOCH FROM (now() - i.created_at)) / 60) - i.total_paused_minutes > p.response_time_minutes
  LOOP
    UPDATE public.incidents SET status = 'escalated', updated_at = now() WHERE id = r.id;
    INSERT INTO public.incident_history (incident_id, user_id, field_changed, old_value, new_value)
    VALUES (r.id, NULL, 'status', 'open', 'escalated');
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END $$;
REVOKE EXECUTE ON FUNCTION public.auto_escalate_stale_incidents() FROM PUBLIC, anon, authenticated;