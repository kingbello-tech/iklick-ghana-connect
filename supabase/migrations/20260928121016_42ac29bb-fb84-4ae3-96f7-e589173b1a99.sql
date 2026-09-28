DO $$
DECLARE r record;
  public_fns text[] := ARRAY['book_meeting','cancel_meeting_booking','get_booking_by_guest_token','get_booking_by_host_token','get_booking_by_token','guest_decide_reschedule','respond_to_booking','submit_survey_response','validate_intake_token','validate_survey_token'];
BEGIN
  FOR r IN SELECT p.oid::regprocedure AS sig, p.proname, p.prorettype = 'trigger'::regtype AS is_trg
           FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
           WHERE n.nspname='public' AND p.prosecdef LOOP
    IF NOT (r.proname = ANY(public_fns)) THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', r.sig);
    END IF;
    IF r.is_trg THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM authenticated', r.sig);
    END IF;
  END LOOP;
END $$;