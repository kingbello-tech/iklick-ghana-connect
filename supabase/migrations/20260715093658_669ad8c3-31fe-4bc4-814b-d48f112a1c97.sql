
CREATE OR REPLACE FUNCTION public.sync_deal_stage_on_survey()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status::text <> 'cancelled' THEN
    UPDATE public.deals
      SET stage = 'site_survey'::deal_stage
      WHERE id = NEW.deal_id
        AND stage::text IN ('new_lead', 'qualification');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_deal_stage_on_survey ON public.site_surveys;
CREATE TRIGGER trg_sync_deal_stage_on_survey
AFTER INSERT ON public.site_surveys
FOR EACH ROW EXECUTE FUNCTION public.sync_deal_stage_on_survey();

UPDATE public.deals d
   SET stage = 'site_survey'::deal_stage
 WHERE d.stage::text IN ('new_lead', 'qualification')
   AND EXISTS (
     SELECT 1 FROM public.site_surveys s
     WHERE s.deal_id = d.id AND s.status::text <> 'cancelled'
   );

CREATE OR REPLACE FUNCTION public.create_invoice_on_install_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deal RECORD;
  v_lead RECORD;
  v_client_id UUID;
  v_invoice_id UUID;
BEGIN
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN
    SELECT id, title, client_id, mrc, nrc, lead_id, created_by, bandwidth
      INTO v_deal FROM public.deals WHERE id = NEW.deal_id;
    IF NOT FOUND THEN RETURN NEW; END IF;

    v_client_id := v_deal.client_id;

    IF v_client_id IS NULL THEN
      IF v_deal.lead_id IS NOT NULL THEN
        SELECT * INTO v_lead FROM public.leads WHERE id = v_deal.lead_id;
      END IF;

      INSERT INTO public.clients (name, email, phone, location, notes)
      VALUES (
        COALESCE(NULLIF(TRIM(COALESCE(v_lead.company_name, v_lead.name, '')), ''), v_deal.title),
        v_lead.email, v_lead.phone, v_lead.location,
        'Auto-created from deal on installation completion.'
      )
      RETURNING id INTO v_client_id;

      UPDATE public.deals SET client_id = v_client_id WHERE id = v_deal.id;

      IF NOT EXISTS (
        SELECT 1 FROM public.client_sites
        WHERE client_id = v_client_id AND name = v_deal.title
      ) THEN
        INSERT INTO public.client_sites (client_id, name, bandwidth, status, created_by, notes)
        VALUES (v_client_id, v_deal.title, v_deal.bandwidth, 'active'::site_status, v_deal.created_by, 'Auto-created on installation completion');
      END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.invoices WHERE deal_id = v_deal.id AND kind = 'initial') THEN
      INSERT INTO public.invoices (
        deal_id, client_id, kind, status,
        mrc_amount, nrc_amount,
        period_start, period_end,
        notes
      ) VALUES (
        v_deal.id, v_client_id, 'initial', 'draft',
        COALESCE(v_deal.mrc, 0), COALESCE(v_deal.nrc, 0),
        CURRENT_DATE, (CURRENT_DATE + INTERVAL '1 month' - INTERVAL '1 day')::date,
        'Initial invoice (NRC + first month MRC) auto-generated on installation completion.'
      ) RETURNING id INTO v_invoice_id;

      PERFORM public.log_audit('invoice', v_invoice_id, 'invoice_created', NULL, NULL, 'draft',
        jsonb_build_object('deal_id', v_deal.id, 'auto', true));

      PERFORM public.notify_role(
        'finance_officer',
        'invoice_ready',
        'New Invoice Drafted - ' || v_deal.title,
        'Initial invoice has been auto-drafted. Review and send to client.',
        '/crm/finance/invoices',
        jsonb_build_object('invoice_id', v_invoice_id, 'deal_id', v_deal.id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE r RECORD; v_client_id UUID; v_lead RECORD;
BEGIN
  FOR r IN
    SELECT i.id AS install_id, d.id AS deal_id, d.title, d.client_id, d.mrc, d.nrc,
           d.lead_id, d.created_by, d.bandwidth
      FROM public.installations i
      JOIN public.deals d ON d.id = i.deal_id
     WHERE i.status = 'completed'
       AND NOT EXISTS (SELECT 1 FROM public.invoices WHERE deal_id = d.id AND kind = 'initial')
  LOOP
    v_client_id := r.client_id;
    IF v_client_id IS NULL THEN
      v_lead := NULL;
      IF r.lead_id IS NOT NULL THEN
        SELECT * INTO v_lead FROM public.leads WHERE id = r.lead_id;
      END IF;
      INSERT INTO public.clients (name, email, phone, location, notes)
      VALUES (
        COALESCE(NULLIF(TRIM(COALESCE(v_lead.company_name, v_lead.name, '')), ''), r.title),
        v_lead.email, v_lead.phone, v_lead.location,
        'Auto-created from deal (backfill).'
      )
      RETURNING id INTO v_client_id;

      UPDATE public.deals SET client_id = v_client_id WHERE id = r.deal_id;

      IF NOT EXISTS (SELECT 1 FROM public.client_sites WHERE client_id = v_client_id AND name = r.title) THEN
        INSERT INTO public.client_sites (client_id, name, bandwidth, status, created_by, notes)
        VALUES (v_client_id, r.title, r.bandwidth, 'active'::site_status, r.created_by, 'Auto-created (backfill).');
      END IF;
    END IF;

    INSERT INTO public.invoices (
      deal_id, client_id, kind, status,
      mrc_amount, nrc_amount, period_start, period_end, notes
    ) VALUES (
      r.deal_id, v_client_id, 'initial', 'draft',
      COALESCE(r.mrc, 0), COALESCE(r.nrc, 0),
      CURRENT_DATE, (CURRENT_DATE + INTERVAL '1 month' - INTERVAL '1 day')::date,
      'Initial invoice auto-generated (backfill).'
    );
  END LOOP;
END $$;
