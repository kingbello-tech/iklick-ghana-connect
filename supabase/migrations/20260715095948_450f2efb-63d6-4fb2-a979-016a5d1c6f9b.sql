CREATE OR REPLACE FUNCTION public.create_installation_on_won()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_mapped_service public.service_type;
BEGIN
  IF NEW.stage = 'closed_won' AND (OLD.stage IS DISTINCT FROM 'closed_won') THEN
    INSERT INTO public.installations (deal_id, status)
    VALUES (NEW.id, 'pending');

    v_mapped_service := CASE NEW.service_type::text
      WHEN 'fiber_home' THEN 'home'::public.service_type
      WHEN 'dedicated_business' THEN 'enterprise'::public.service_type
      WHEN 'enterprise_link' THEN 'enterprise'::public.service_type
      ELSE NULL
    END;

    IF NEW.client_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.client_sites
        WHERE client_id = NEW.client_id AND name = NEW.title
      ) THEN
        INSERT INTO public.client_sites (client_id, name, service_type, bandwidth, status, created_by, notes)
        VALUES (
          NEW.client_id,
          NEW.title,
          v_mapped_service,
          NEW.bandwidth,
          'onboarding',
          NEW.created_by,
          'Auto-created from deal on close-won'
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;