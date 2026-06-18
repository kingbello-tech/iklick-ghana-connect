CREATE OR REPLACE FUNCTION public.notify_host_on_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_user UUID;
BEGIN
  SELECT user_id INTO v_user FROM public.meeting_hosts WHERE id = NEW.host_id;
  IF v_user IS NOT NULL THEN
    PERFORM public.notify_user(
      v_user,
      'meeting_booked',
      'New meeting booked',
      NEW.guest_name || ' booked ' || to_char(NEW.start_at, 'Dy, Mon DD at HH24:MI') || ' (' || NEW.guest_email || ')',
      '/crm/meeting-links',
      jsonb_build_object('booking_id', NEW.id, 'host_id', NEW.host_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_meeting_booking_notify
  AFTER INSERT ON public.meeting_bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_host_on_booking();