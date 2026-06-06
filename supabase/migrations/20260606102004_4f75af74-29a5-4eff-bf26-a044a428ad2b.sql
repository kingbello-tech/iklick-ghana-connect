CREATE OR REPLACE FUNCTION public.create_installation_on_won()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.stage = 'closed_won' AND (OLD.stage IS DISTINCT FROM 'closed_won') THEN
    INSERT INTO public.installations (deal_id, status)
    VALUES (NEW.id, 'pending');

    -- Also create a client_sites row linking this deal as a site under the client
    IF NEW.client_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.client_sites
        WHERE client_id = NEW.client_id AND name = NEW.title
      ) THEN
        INSERT INTO public.client_sites (client_id, name, service_type, bandwidth, status, created_by, notes)
        VALUES (
          NEW.client_id,
          NEW.title,
          NEW.service_type,
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