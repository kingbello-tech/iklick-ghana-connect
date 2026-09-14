CREATE OR REPLACE FUNCTION public.on_site_survey_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deal RECORD;
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM public.log_audit('site_survey', NEW.id, 'status_changed', 'status', OLD.status::text, NEW.status::text);
  END IF;

  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN
    SELECT id, title, assigned_to, created_by, stage INTO v_deal FROM public.deals WHERE id = NEW.deal_id;
    IF FOUND THEN
      UPDATE public.deals
         SET survey_completed_at = COALESCE(NEW.completed_at, now()),
             stage = CASE WHEN stage::text IN ('new_lead','qualification','site_survey')
                          THEN 'proposal_sent'::deal_stage ELSE stage END
       WHERE id = v_deal.id;

      PERFORM public.log_audit('deal', v_deal.id, 'survey_completed', NULL, NULL, NEW.feasibility::text,
        jsonb_build_object('survey_id', NEW.id, 'cost_estimate', NEW.cost_estimate));

      PERFORM public.notify_user(
        COALESCE(v_deal.assigned_to, v_deal.created_by),
        'survey_completed',
        'Site Survey Completed - ' || v_deal.title,
        'The site survey is complete. Feasibility: ' || NEW.feasibility::text || COALESCE('. Cost estimate: GHS ' || NEW.cost_estimate::text, '') || '. Deal moved to Proposal/Costing.',
        '/crm/sales/pipeline',
        jsonb_build_object('deal_id', v_deal.id, 'survey_id', NEW.id)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

UPDATE public.deals d
   SET survey_completed_at = COALESCE(d.survey_completed_at, s.completed_at, now()),
       stage = 'proposal_sent'::deal_stage
  FROM public.site_surveys s
 WHERE s.deal_id = d.id
   AND s.status::text = 'completed'
   AND d.stage::text IN ('new_lead','qualification','site_survey');