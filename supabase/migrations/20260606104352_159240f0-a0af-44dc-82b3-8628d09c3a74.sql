
-- ============ SURVEY TOKENS ============
DROP POLICY IF EXISTS "Anyone can read token by value" ON public.survey_tokens;
-- keep authenticated staff view (admins/CX need to inspect tokens in the dashboard)

CREATE OR REPLACE FUNCTION public.validate_survey_token(_token text)
RETURNS TABLE (
  id uuid,
  client_id uuid,
  incident_id uuid,
  expires_at timestamptz,
  used boolean,
  client_name text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT st.id, st.client_id, st.incident_id, st.expires_at, st.used, c.name
  FROM public.survey_tokens st
  LEFT JOIN public.clients c ON c.id = st.client_id
  WHERE st.token = _token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.validate_survey_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_survey_token(text) TO anon, authenticated;

-- Allow anonymous survey submission via a server-side function (replaces direct client_satisfaction insert + token update)
CREATE OR REPLACE FUNCTION public.submit_survey_response(
  _token text,
  _rating int,
  _feedback text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_tok RECORD;
BEGIN
  SELECT id, client_id, incident_id, used, expires_at
    INTO v_tok
  FROM public.survey_tokens
  WHERE token = _token
  LIMIT 1;

  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid token'; END IF;
  IF v_tok.used THEN RAISE EXCEPTION 'Token already used'; END IF;
  IF v_tok.expires_at < now() THEN RAISE EXCEPTION 'Token expired'; END IF;
  IF _rating < 1 OR _rating > 5 THEN RAISE EXCEPTION 'Invalid rating'; END IF;

  INSERT INTO public.client_satisfaction (client_id, incident_id, rating, feedback, surveyed_by)
  VALUES (v_tok.client_id, v_tok.incident_id, _rating, _feedback, '00000000-0000-0000-0000-000000000000');

  UPDATE public.survey_tokens SET used = true WHERE id = v_tok.id;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_survey_response(text,int,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_survey_response(text,int,text) TO anon, authenticated;

-- Drop the broad anon "mark used" policy since the function above handles it
DROP POLICY IF EXISTS "Anon can mark token as used" ON public.survey_tokens;

-- ============ CLIENTS ============
DROP POLICY IF EXISTS "Anon can read clients for survey" ON public.clients;

-- ============ INTAKE LINKS ============
DROP POLICY IF EXISTS "Anon read active intake link by token" ON public.intake_links;

CREATE OR REPLACE FUNCTION public.validate_intake_token(_token text)
RETURNS TABLE (id uuid, active boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, active FROM public.intake_links
  WHERE token = _token AND active = true
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.validate_intake_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_intake_token(text) TO anon, authenticated;

-- ============ NOTIFICATIONS ============
DROP POLICY IF EXISTS "Authenticated insert notifications" ON public.notifications;
CREATE POLICY "Users insert own notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
