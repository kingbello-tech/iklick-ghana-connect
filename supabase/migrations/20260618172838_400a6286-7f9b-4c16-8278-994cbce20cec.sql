
-- Per-user Microsoft Outlook OAuth tokens for meeting hosts
CREATE TABLE IF NOT EXISTS public.meeting_host_outlook_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  outlook_email TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  scope TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_host_outlook_tokens TO authenticated;
GRANT ALL ON public.meeting_host_outlook_tokens TO service_role;

ALTER TABLE public.meeting_host_outlook_tokens ENABLE ROW LEVEL SECURITY;

-- Users can see whether they themselves are connected, but never see the tokens directly via a view-only policy
CREATE POLICY "Users can view own outlook connection" ON public.meeting_host_outlook_tokens
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own outlook connection" ON public.meeting_host_outlook_tokens
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Safe view that exposes only connection status (no tokens) for the UI
CREATE OR REPLACE VIEW public.meeting_host_outlook_status AS
  SELECT user_id, outlook_email, expires_at, updated_at
  FROM public.meeting_host_outlook_tokens;

GRANT SELECT ON public.meeting_host_outlook_status TO authenticated;

-- Update book_meeting to require host's Outlook connection
CREATE OR REPLACE FUNCTION public.book_meeting(_slug text, _start_at timestamp with time zone, _guest_name text, _guest_email text, _notes text DEFAULT NULL::text)
 RETURNS TABLE(booking_id uuid, cancel_token uuid, end_at timestamp with time zone, teams_join_url text, display_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_host RECORD;
  v_end TIMESTAMPTZ;
  v_weekday INT;
  v_local_time TIME;
  v_id UUID;
  v_token UUID;
BEGIN
  IF _guest_name IS NULL OR length(trim(_guest_name)) < 2 THEN
    RAISE EXCEPTION 'Name is required';
  END IF;
  IF _guest_email IS NULL OR _guest_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'Valid email is required';
  END IF;

  SELECT * INTO v_host FROM public.meeting_hosts WHERE slug = _slug AND is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Host not found'; END IF;

  -- Require host to have connected their Outlook mailbox
  IF NOT EXISTS (SELECT 1 FROM public.meeting_host_outlook_tokens WHERE user_id = v_host.user_id) THEN
    RAISE EXCEPTION 'This host has not finished setting up their calendar. Please contact them directly to schedule a meeting.';
  END IF;

  IF _start_at < now() + make_interval(hours => v_host.advance_notice_hours) THEN
    RAISE EXCEPTION 'Slot too soon. Please pick a later time.';
  END IF;
  IF _start_at > now() + make_interval(days => v_host.max_days_ahead) THEN
    RAISE EXCEPTION 'Slot too far in the future.';
  END IF;

  v_end := _start_at + make_interval(mins => v_host.slot_minutes);

  v_weekday := EXTRACT(DOW FROM (_start_at AT TIME ZONE v_host.timezone))::INT;
  v_local_time := (_start_at AT TIME ZONE v_host.timezone)::TIME;

  IF NOT EXISTS (
    SELECT 1 FROM public.meeting_availability a
    WHERE a.host_id = v_host.id
      AND a.weekday = v_weekday
      AND a.start_time <= v_local_time
      AND a.end_time >= (v_local_time + make_interval(mins => v_host.slot_minutes))
  ) THEN
    RAISE EXCEPTION 'Slot is outside available hours';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.meeting_blackouts b
    WHERE b.host_id = v_host.id
      AND b.start_at < v_end
      AND b.end_at > _start_at
  ) THEN
    RAISE EXCEPTION 'Slot is unavailable';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.meeting_bookings b
    WHERE b.host_id = v_host.id
      AND b.status = 'confirmed'
      AND b.start_at < (v_end + make_interval(mins => v_host.buffer_minutes))
      AND b.end_at > (_start_at - make_interval(mins => v_host.buffer_minutes))
  ) THEN
    RAISE EXCEPTION 'Slot is already booked';
  END IF;

  INSERT INTO public.meeting_bookings (host_id, start_at, end_at, guest_name, guest_email, notes)
  VALUES (v_host.id, _start_at, v_end, trim(_guest_name), lower(trim(_guest_email)), _notes)
  RETURNING id, meeting_bookings.cancel_token INTO v_id, v_token;

  RETURN QUERY SELECT v_id, v_token, v_end, v_host.teams_join_url, v_host.display_name;
END;
$function$;
