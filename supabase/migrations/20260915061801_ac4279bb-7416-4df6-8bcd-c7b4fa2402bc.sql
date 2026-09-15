CREATE OR REPLACE FUNCTION public.create_invoice_on_install_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deal RECORD;
  v_lead_name TEXT;
  v_lead_company TEXT;
  v_lead_email TEXT;
  v_lead_phone TEXT;
  v_lead_location TEXT;
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
        SELECT company_name, name, email, phone, location
          INTO v_lead_company, v_lead_name, v_lead_email, v_lead_phone, v_lead_location
          FROM public.leads WHERE id = v_deal.lead_id;
      END IF;

      INSERT INTO public.clients (name, email, phone, location, notes)
      VALUES (
        COALESCE(NULLIF(TRIM(COALESCE(v_lead_company, v_lead_name, '')), ''), v_deal.title),
        v_lead_email, v_lead_phone, v_lead_location,
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