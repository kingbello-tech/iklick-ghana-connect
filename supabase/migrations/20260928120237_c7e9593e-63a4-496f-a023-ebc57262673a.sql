CREATE OR REPLACE FUNCTION public.sync_downstream_on_deal_stage()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF OLD.stage = 'closed_won' AND NEW.stage IS DISTINCT FROM 'closed_won' THEN
    UPDATE public.installations
       SET status = 'cancelled',
           notes = COALESCE(notes || E'\n', '') || 'Auto-cancelled: deal moved back to ' || NEW.stage::text || ' on ' || to_char(now(), 'YYYY-MM-DD')
     WHERE deal_id = NEW.id AND status IN ('pending','in_progress');
    UPDATE public.projects SET status = 'on_hold'
     WHERE deal_id = NEW.id AND status IN ('planning','active');
    PERFORM public.log_audit('deal', NEW.id, 'downstream_reverted', 'stage', OLD.stage::text, NEW.stage::text);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_sync_downstream_on_deal_stage ON public.deals;
CREATE TRIGGER trg_sync_downstream_on_deal_stage AFTER UPDATE OF stage ON public.deals
FOR EACH ROW EXECUTE FUNCTION public.sync_downstream_on_deal_stage();

CREATE OR REPLACE FUNCTION public.create_installation_on_won()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_mapped_service public.service_type;
BEGIN
  IF NEW.stage = 'closed_won' AND (OLD.stage IS DISTINCT FROM 'closed_won') THEN
    -- Reopen an auto-cancelled installation instead of duplicating on re-win
    IF EXISTS (SELECT 1 FROM public.installations WHERE deal_id = NEW.id AND status = 'cancelled') 
       AND NOT EXISTS (SELECT 1 FROM public.installations WHERE deal_id = NEW.id AND status IN ('pending','in_progress','completed')) THEN
      UPDATE public.installations SET status = 'pending'
       WHERE id = (SELECT id FROM public.installations WHERE deal_id = NEW.id AND status = 'cancelled' ORDER BY created_at DESC LIMIT 1);
    ELSIF NOT EXISTS (SELECT 1 FROM public.installations WHERE deal_id = NEW.id AND status IN ('pending','in_progress','completed')) THEN
      INSERT INTO public.installations (deal_id, status) VALUES (NEW.id, 'pending');
    END IF;
    UPDATE public.projects SET status = 'planning' WHERE deal_id = NEW.id AND status = 'on_hold';

    v_mapped_service := CASE NEW.service_type::text
      WHEN 'fiber_home' THEN 'home'::public.service_type
      WHEN 'dedicated_business' THEN 'enterprise'::public.service_type
      WHEN 'enterprise_link' THEN 'enterprise'::public.service_type
      ELSE NULL
    END;

    IF NEW.client_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.client_sites WHERE client_id = NEW.client_id AND name = NEW.title) THEN
        INSERT INTO public.client_sites (client_id, name, service_type, bandwidth, status, created_by, notes)
        VALUES (NEW.client_id, NEW.title, v_mapped_service, NEW.bandwidth, 'onboarding', NEW.created_by, 'Auto-created from deal on close-won');
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Backfill: clean up existing stale work for deals no longer won
UPDATE public.installations i
   SET status = 'cancelled',
       notes = COALESCE(i.notes || E'\n', '') || 'Auto-cancelled: deal is no longer won'
  FROM public.deals d
 WHERE d.id = i.deal_id AND d.stage <> 'closed_won' AND i.status IN ('pending','in_progress');
UPDATE public.projects p SET status = 'on_hold'
  FROM public.deals d
 WHERE d.id = p.deal_id AND d.stage <> 'closed_won' AND p.status IN ('planning','active');