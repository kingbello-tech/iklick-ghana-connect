-- Auto-create a site_survey record when a deal moves into the site_survey stage
CREATE OR REPLACE FUNCTION public.create_site_survey_on_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.stage = 'site_survey' AND (OLD.stage IS DISTINCT FROM 'site_survey') THEN
    -- Only insert if no survey already exists for this deal
    IF NOT EXISTS (SELECT 1 FROM public.site_surveys WHERE deal_id = NEW.id) THEN
      INSERT INTO public.site_surveys (deal_id, requested_by, requested_at, status, feasibility)
      VALUES (NEW.id, NEW.assigned_to, now(), 'scheduled', 'pending');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_site_survey_on_stage_change ON public.deals;
CREATE TRIGGER trg_create_site_survey_on_stage_change
AFTER UPDATE OF stage ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.create_site_survey_on_stage_change();

-- Backfill: any deal currently in site_survey stage without a survey row
INSERT INTO public.site_surveys (deal_id, requested_by, requested_at, status, feasibility)
SELECT d.id, d.assigned_to, now(), 'scheduled', 'pending'
FROM public.deals d
WHERE d.stage = 'site_survey'
  AND NOT EXISTS (SELECT 1 FROM public.site_surveys s WHERE s.deal_id = d.id);