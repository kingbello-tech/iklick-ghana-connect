CREATE OR REPLACE FUNCTION public.validate_deal_stage_transition()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.stage IS DISTINCT FROM NEW.stage THEN
    -- once a survey is completed, the deal cannot drop back to pre-survey stages
    IF NEW.stage::text IN ('new_lead','qualification','site_survey')
       AND EXISTS (SELECT 1 FROM public.site_surveys WHERE deal_id = NEW.id AND status = 'completed') THEN
      RAISE EXCEPTION 'Cannot move back to %: the site survey for this deal is already completed', NEW.stage;
    END IF;
    IF NEW.stage = 'negotiation' AND NOT EXISTS (SELECT 1 FROM public.quotations WHERE deal_id = NEW.id) THEN
      RAISE EXCEPTION 'Cannot move to negotiation: a quotation is required';
    END IF;
    IF NEW.stage = 'closed_won' THEN
      IF NOT EXISTS (SELECT 1 FROM public.quotations WHERE deal_id = NEW.id AND status = 'accepted') THEN
        RAISE EXCEPTION 'Cannot close-won: an accepted quotation is required';
      END IF;
      IF NEW.survey_completed_at IS NULL THEN
        RAISE EXCEPTION 'Cannot close-won: site survey must be completed';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $function$;

-- repair deals stuck before proposal despite a completed survey
UPDATE public.deals d
   SET stage = 'proposal_sent'::deal_stage,
       survey_completed_at = COALESCE(d.survey_completed_at, s.completed_at, now())
  FROM public.site_surveys s
 WHERE s.deal_id = d.id AND s.status = 'completed'
   AND d.stage::text IN ('new_lead','qualification','site_survey');