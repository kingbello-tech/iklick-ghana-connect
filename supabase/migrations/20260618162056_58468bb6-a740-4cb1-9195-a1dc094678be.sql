
-- Extend meeting_bookings with host approval workflow
ALTER TABLE public.meeting_bookings
  ADD COLUMN IF NOT EXISTS host_action_token UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS host_response TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS host_responded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS host_message TEXT,
  ADD COLUMN IF NOT EXISTS proposed_start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS proposed_end_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS guest_action_token UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS guest_decision TEXT,
  ADD COLUMN IF NOT EXISTS guest_decided_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS meeting_bookings_host_action_token_idx
  ON public.meeting_bookings(host_action_token);
CREATE UNIQUE INDEX IF NOT EXISTS meeting_bookings_guest_action_token_idx
  ON public.meeting_bookings(guest_action_token);

-- Allow proposed/pending statuses going forward (kept as text — no enum changes)
-- Existing rows keep their status

-- Lookup a booking by the host action token (used by the host response page)
CREATE OR REPLACE FUNCTION public.get_booking_by_host_token(_token uuid)
RETURNS TABLE(
  booking_id uuid,
  start_at timestamptz,
  end_at timestamptz,
  status text,
  host_response text,
  proposed_start_at timestamptz,
  guest_name text,
  guest_email text,
  guest_notes text,
  host_display_name text,
  host_user_id uuid,
  slug text,
  timezone text,
  teams_join_url text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT b.id, b.start_at, b.end_at, b.status, b.host_response, b.proposed_start_at,
         b.guest_name, b.guest_email, b.notes,
         h.display_name, h.user_id, h.slug, h.timezone, h.teams_join_url
  FROM public.meeting_bookings b
  JOIN public.meeting_hosts h ON h.id = b.host_id
  WHERE b.host_action_token = _token
$$;

-- Host records their decision
CREATE OR REPLACE FUNCTION public.respond_to_booking(
  _token uuid,
  _action text,
  _proposed_start timestamptz DEFAULT NULL,
  _message text DEFAULT NULL
)
RETURNS TABLE(
  booking_id uuid,
  guest_action_token uuid,
  guest_email text,
  guest_name text,
  start_at timestamptz,
  end_at timestamptz,
  proposed_start_at timestamptz,
  host_display_name text
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_b RECORD;
  v_host RECORD;
  v_new_end TIMESTAMPTZ;
BEGIN
  IF _action NOT IN ('accepted','declined','reschedule') THEN
    RAISE EXCEPTION 'Invalid action';
  END IF;

  SELECT * INTO v_b FROM public.meeting_bookings WHERE host_action_token = _token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid token'; END IF;
  IF v_b.host_response <> 'pending' THEN
    RAISE EXCEPTION 'This booking has already been responded to';
  END IF;

  SELECT * INTO v_host FROM public.meeting_hosts WHERE id = v_b.host_id;

  IF _action = 'accepted' THEN
    UPDATE public.meeting_bookings
      SET host_response='accepted', host_responded_at=now(),
          status='confirmed', host_message=_message
      WHERE id = v_b.id;
  ELSIF _action = 'declined' THEN
    UPDATE public.meeting_bookings
      SET host_response='declined', host_responded_at=now(),
          status='cancelled', host_message=_message
      WHERE id = v_b.id;
  ELSE -- reschedule
    IF _proposed_start IS NULL THEN
      RAISE EXCEPTION 'Proposed time required for reschedule';
    END IF;
    IF _proposed_start < now() THEN
      RAISE EXCEPTION 'Proposed time must be in the future';
    END IF;
    v_new_end := _proposed_start + make_interval(mins => v_host.slot_minutes);
    UPDATE public.meeting_bookings
      SET host_response='reschedule', host_responded_at=now(),
          proposed_start_at=_proposed_start, proposed_end_at=v_new_end,
          host_message=_message
      WHERE id = v_b.id;
  END IF;

  RETURN QUERY
    SELECT v_b.id, v_b.guest_action_token, v_b.guest_email, v_b.guest_name,
           v_b.start_at, v_b.end_at,
           COALESCE(_proposed_start, v_b.proposed_start_at),
           v_host.display_name;
END;
$$;

-- Guest looks up a booking by guest action token (for reschedule confirmation page)
CREATE OR REPLACE FUNCTION public.get_booking_by_guest_token(_token uuid)
RETURNS TABLE(
  booking_id uuid,
  status text,
  host_response text,
  start_at timestamptz,
  end_at timestamptz,
  proposed_start_at timestamptz,
  proposed_end_at timestamptz,
  guest_name text,
  guest_email text,
  guest_decision text,
  host_display_name text,
  host_message text,
  timezone text,
  teams_join_url text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT b.id, b.status, b.host_response, b.start_at, b.end_at,
         b.proposed_start_at, b.proposed_end_at,
         b.guest_name, b.guest_email, b.guest_decision,
         h.display_name, b.host_message, h.timezone, h.teams_join_url
  FROM public.meeting_bookings b
  JOIN public.meeting_hosts h ON h.id = b.host_id
  WHERE b.guest_action_token = _token
$$;

-- Guest accepts or declines the proposed new time
CREATE OR REPLACE FUNCTION public.guest_decide_reschedule(_token uuid, _accept boolean)
RETURNS TABLE(
  booking_id uuid,
  start_at timestamptz,
  end_at timestamptz,
  status text,
  host_user_id uuid,
  host_display_name text,
  guest_email text,
  guest_name text
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_b RECORD; v_host RECORD;
BEGIN
  SELECT * INTO v_b FROM public.meeting_bookings WHERE guest_action_token = _token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid token'; END IF;
  IF v_b.host_response <> 'reschedule' THEN
    RAISE EXCEPTION 'No reschedule pending';
  END IF;
  IF v_b.guest_decision IS NOT NULL THEN
    RAISE EXCEPTION 'You have already responded';
  END IF;
  SELECT * INTO v_host FROM public.meeting_hosts WHERE id = v_b.host_id;

  IF _accept THEN
    UPDATE public.meeting_bookings
      SET start_at = v_b.proposed_start_at,
          end_at = v_b.proposed_end_at,
          status = 'confirmed',
          guest_decision = 'accepted',
          guest_decided_at = now()
      WHERE id = v_b.id;
  ELSE
    UPDATE public.meeting_bookings
      SET status = 'cancelled',
          guest_decision = 'declined',
          guest_decided_at = now()
      WHERE id = v_b.id;
  END IF;

  RETURN QUERY
    SELECT v_b.id,
           CASE WHEN _accept THEN v_b.proposed_start_at ELSE v_b.start_at END,
           CASE WHEN _accept THEN v_b.proposed_end_at ELSE v_b.end_at END,
           CASE WHEN _accept THEN 'confirmed' ELSE 'cancelled' END,
           v_host.user_id, v_host.display_name,
           v_b.guest_email, v_b.guest_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_booking_by_host_token(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_booking(uuid, text, timestamptz, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_booking_by_guest_token(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guest_decide_reschedule(uuid, boolean) TO anon, authenticated;
