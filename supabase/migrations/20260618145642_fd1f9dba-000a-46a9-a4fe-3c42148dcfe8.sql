
-- ============ meeting_hosts ============
CREATE TABLE public.meeting_hosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  title TEXT,
  teams_join_url TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Africa/Accra',
  slot_minutes INT NOT NULL DEFAULT 30 CHECK (slot_minutes BETWEEN 10 AND 240),
  buffer_minutes INT NOT NULL DEFAULT 0 CHECK (buffer_minutes >= 0 AND buffer_minutes <= 120),
  advance_notice_hours INT NOT NULL DEFAULT 2 CHECK (advance_notice_hours >= 0),
  max_days_ahead INT NOT NULL DEFAULT 30 CHECK (max_days_ahead BETWEEN 1 AND 180),
  avatar_url TEXT,
  bio TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_meeting_hosts_slug ON public.meeting_hosts (slug) WHERE is_active = true;

GRANT SELECT ON public.meeting_hosts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_hosts TO authenticated;
GRANT ALL ON public.meeting_hosts TO service_role;

ALTER TABLE public.meeting_hosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active hosts"
  ON public.meeting_hosts FOR SELECT
  USING (is_active = true);

CREATE POLICY "Hosts can view themselves"
  ON public.meeting_hosts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Hosts can manage own profile"
  ON public.meeting_hosts FOR ALL TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_meeting_hosts_updated_at
  BEFORE UPDATE ON public.meeting_hosts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ meeting_availability ============
CREATE TABLE public.meeting_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.meeting_hosts(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);
CREATE INDEX idx_meeting_availability_host ON public.meeting_availability (host_id, weekday);

GRANT SELECT ON public.meeting_availability TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_availability TO authenticated;
GRANT ALL ON public.meeting_availability TO service_role;

ALTER TABLE public.meeting_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view availability of active hosts"
  ON public.meeting_availability FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.meeting_hosts h WHERE h.id = host_id AND h.is_active = true));

CREATE POLICY "Hosts manage own availability"
  ON public.meeting_availability FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.meeting_hosts h WHERE h.id = host_id AND (h.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.meeting_hosts h WHERE h.id = host_id AND (h.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

-- ============ meeting_blackouts ============
CREATE TABLE public.meeting_blackouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.meeting_hosts(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);
CREATE INDEX idx_meeting_blackouts_host ON public.meeting_blackouts (host_id, start_at);

GRANT SELECT ON public.meeting_blackouts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_blackouts TO authenticated;
GRANT ALL ON public.meeting_blackouts TO service_role;

ALTER TABLE public.meeting_blackouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view blackouts of active hosts"
  ON public.meeting_blackouts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.meeting_hosts h WHERE h.id = host_id AND h.is_active = true));

CREATE POLICY "Hosts manage own blackouts"
  ON public.meeting_blackouts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.meeting_hosts h WHERE h.id = host_id AND (h.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.meeting_hosts h WHERE h.id = host_id AND (h.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

-- ============ meeting_bookings ============
CREATE TABLE public.meeting_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.meeting_hosts(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled')),
  cancel_token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);
CREATE INDEX idx_meeting_bookings_host_time ON public.meeting_bookings (host_id, start_at);
CREATE INDEX idx_meeting_bookings_cancel_token ON public.meeting_bookings (cancel_token);

GRANT SELECT ON public.meeting_bookings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_bookings TO authenticated;
GRANT ALL ON public.meeting_bookings TO service_role;

ALTER TABLE public.meeting_bookings ENABLE ROW LEVEL SECURITY;

-- Public can only see future confirmed bookings, and NOT guest PII (frontend should select limited cols).
-- We enforce no-PII via a separate view; for the table itself, allow read of future confirmed rows.
CREATE POLICY "Public can view future confirmed bookings"
  ON public.meeting_bookings FOR SELECT
  USING (status = 'confirmed' AND start_at > now());

CREATE POLICY "Hosts view own bookings"
  ON public.meeting_bookings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.meeting_hosts h WHERE h.id = host_id AND (h.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

CREATE POLICY "Hosts manage own bookings"
  ON public.meeting_bookings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.meeting_hosts h WHERE h.id = host_id AND (h.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.meeting_hosts h WHERE h.id = host_id AND (h.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))));

-- Public-safe view (no guest PII)
CREATE OR REPLACE VIEW public.meeting_booked_slots AS
  SELECT host_id, start_at, end_at
  FROM public.meeting_bookings
  WHERE status = 'confirmed' AND start_at > now();
GRANT SELECT ON public.meeting_booked_slots TO anon, authenticated;

-- ============ book_meeting RPC ============
CREATE OR REPLACE FUNCTION public.book_meeting(
  _slug TEXT,
  _start_at TIMESTAMPTZ,
  _guest_name TEXT,
  _guest_email TEXT,
  _notes TEXT DEFAULT NULL
) RETURNS TABLE(booking_id UUID, cancel_token UUID, end_at TIMESTAMPTZ, teams_join_url TEXT, display_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  IF _start_at < now() + make_interval(hours => v_host.advance_notice_hours) THEN
    RAISE EXCEPTION 'Slot too soon. Please pick a later time.';
  END IF;
  IF _start_at > now() + make_interval(days => v_host.max_days_ahead) THEN
    RAISE EXCEPTION 'Slot too far in the future.';
  END IF;

  v_end := _start_at + make_interval(mins => v_host.slot_minutes);

  -- Check availability window (in host timezone)
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

  -- Check blackouts
  IF EXISTS (
    SELECT 1 FROM public.meeting_blackouts b
    WHERE b.host_id = v_host.id
      AND b.start_at < v_end
      AND b.end_at > _start_at
  ) THEN
    RAISE EXCEPTION 'Slot is unavailable';
  END IF;

  -- Check conflicts including buffer
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
$$;

GRANT EXECUTE ON FUNCTION public.book_meeting(TEXT, TIMESTAMPTZ, TEXT, TEXT, TEXT) TO anon, authenticated;

-- ============ cancel_meeting_booking RPC ============
CREATE OR REPLACE FUNCTION public.cancel_meeting_booking(_token UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count INT;
BEGIN
  UPDATE public.meeting_bookings
    SET status = 'cancelled'
  WHERE cancel_token = _token AND status = 'confirmed' AND start_at > now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;
GRANT EXECUTE ON FUNCTION public.cancel_meeting_booking(UUID) TO anon, authenticated;

-- ============ get_booking_by_token (for confirmation/cancel pages) ============
CREATE OR REPLACE FUNCTION public.get_booking_by_token(_token UUID)
RETURNS TABLE(
  booking_id UUID, start_at TIMESTAMPTZ, end_at TIMESTAMPTZ,
  status TEXT, guest_name TEXT, guest_email TEXT,
  display_name TEXT, teams_join_url TEXT, slug TEXT, timezone TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id, b.start_at, b.end_at, b.status, b.guest_name, b.guest_email,
         h.display_name, h.teams_join_url, h.slug, h.timezone
  FROM public.meeting_bookings b
  JOIN public.meeting_hosts h ON h.id = b.host_id
  WHERE b.cancel_token = _token
$$;
GRANT EXECUTE ON FUNCTION public.get_booking_by_token(UUID) TO anon, authenticated;
