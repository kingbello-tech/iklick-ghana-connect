DO $$
DECLARE
  d RECORD;
  v_client_id UUID;
  v_service_type service_type;
BEGIN
  FOR d IN
    SELECT id, title, service_type::text AS svc
    FROM public.deals
    WHERE stage = 'closed_won' AND client_id IS NULL
  LOOP
    v_service_type := CASE
      WHEN d.svc = 'fiber_home' THEN 'home'::service_type
      ELSE 'enterprise'::service_type
    END;

    INSERT INTO public.clients (name, service_type, notes)
    VALUES (d.title, v_service_type, 'Auto-created from won deal during finance backfill')
    RETURNING id INTO v_client_id;

    UPDATE public.deals SET client_id = v_client_id WHERE id = d.id;

    PERFORM public.log_audit('deal', d.id, 'client_linked', 'client_id', NULL, v_client_id::text,
      jsonb_build_object('source', 'finance_backfill', 'auto_created_client', true));
  END LOOP;
END $$;