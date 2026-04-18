-- ============== ENUMS ==============
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled');
CREATE TYPE public.payment_method AS ENUM ('bank_transfer', 'mobile_money', 'cash', 'cheque', 'card', 'other');
CREATE TYPE public.invoice_kind AS ENUM ('initial', 'recurring', 'one_off', 'credit_note');

-- ============== SEQUENCE ==============
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START 1;

-- ============== INVOICES TABLE ==============
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  parent_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  kind public.invoice_kind NOT NULL DEFAULT 'recurring',
  status public.invoice_status NOT NULL DEFAULT 'draft',
  mrc_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  nrc_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat_rate NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  vat_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance_due NUMERIC(12,2) NOT NULL DEFAULT 0,
  period_start DATE,
  period_end DATE,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '14 days'),
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_deal ON public.invoices(deal_id);
CREATE INDEX idx_invoices_client ON public.invoices(client_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_due ON public.invoices(due_date);

-- ============== PAYMENTS TABLE ==============
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  method public.payment_method NOT NULL DEFAULT 'bank_transfer',
  reference TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  recorded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_invoice ON public.payments(invoice_id);

-- ============== RLS ==============
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Invoices policies
CREATE POLICY "Finance and admin view all invoices"
  ON public.invoices FOR SELECT TO authenticated
  USING (public.has_finance_access(auth.uid()));

CREATE POLICY "Sales view own deal invoices"
  ON public.invoices FOR SELECT TO authenticated
  USING (
    public.has_sales_access(auth.uid())
    AND deal_id IN (SELECT id FROM public.deals WHERE assigned_to = auth.uid() OR created_by = auth.uid())
  );

CREATE POLICY "Finance create invoices"
  ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (public.has_finance_access(auth.uid()) OR auth.uid() IS NOT NULL);
  -- allow system trigger inserts (auth.uid is NULL is blocked anyway via trigger SECURITY DEFINER bypass)

CREATE POLICY "Finance update invoices"
  ON public.invoices FOR UPDATE TO authenticated
  USING (public.has_finance_access(auth.uid()))
  WITH CHECK (public.has_finance_access(auth.uid()));

CREATE POLICY "Admins delete invoices"
  ON public.invoices FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Payments policies
CREATE POLICY "Finance view payments"
  ON public.payments FOR SELECT TO authenticated
  USING (public.has_finance_access(auth.uid()));

CREATE POLICY "Finance record payments"
  ON public.payments FOR INSERT TO authenticated
  WITH CHECK (public.has_finance_access(auth.uid()));

CREATE POLICY "Finance update payments"
  ON public.payments FOR UPDATE TO authenticated
  USING (public.has_finance_access(auth.uid()))
  WITH CHECK (public.has_finance_access(auth.uid()));

CREATE POLICY "Admins delete payments"
  ON public.payments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============== HELPER FUNCTIONS ==============

-- Generate invoice number INV-00001
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || LPAD(nextval('public.invoice_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- Auto-calc subtotal/vat/total/balance
CREATE OR REPLACE FUNCTION public.calculate_invoice_totals()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.subtotal := COALESCE(NEW.mrc_amount, 0) + COALESCE(NEW.nrc_amount, 0);
  NEW.vat_amount := ROUND(NEW.subtotal * COALESCE(NEW.vat_rate, 15) / 100, 2);
  NEW.total := NEW.subtotal + NEW.vat_amount;
  NEW.balance_due := NEW.total - COALESCE(NEW.amount_paid, 0);
  RETURN NEW;
END;
$$;

-- updated_at trigger
CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Number + totals on insert
CREATE TRIGGER trg_invoices_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.generate_invoice_number();

CREATE TRIGGER trg_invoices_totals
  BEFORE INSERT OR UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.calculate_invoice_totals();

-- ============== PAYMENT -> INVOICE STATUS SYNC ==============
CREATE OR REPLACE FUNCTION public.sync_invoice_on_payment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total NUMERIC(12,2);
  v_paid NUMERIC(12,2);
  v_invoice RECORD;
BEGIN
  SELECT * INTO v_invoice FROM public.invoices WHERE id = NEW.invoice_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_paid FROM public.payments WHERE invoice_id = NEW.invoice_id;
  v_total := v_invoice.total;

  UPDATE public.invoices
  SET amount_paid = v_paid,
      balance_due = v_total - v_paid,
      status = CASE
                 WHEN v_paid >= v_total THEN 'paid'::invoice_status
                 WHEN v_paid > 0 THEN 'partially_paid'::invoice_status
                 ELSE status
               END,
      paid_at = CASE WHEN v_paid >= v_total THEN now() ELSE paid_at END
  WHERE id = NEW.invoice_id;

  PERFORM public.log_audit('invoice', NEW.invoice_id, 'payment_recorded', 'amount_paid',
    v_invoice.amount_paid::text, v_paid::text,
    jsonb_build_object('payment_id', NEW.id, 'amount', NEW.amount, 'method', NEW.method));

  -- Activate billing on deal when first payment received
  IF v_invoice.deal_id IS NOT NULL AND v_paid > 0 THEN
    UPDATE public.deals
    SET billing_active_at = COALESCE(billing_active_at, now())
    WHERE id = v_invoice.deal_id AND billing_active_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payments_sync_invoice
  AFTER INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.sync_invoice_on_payment();

-- ============== AUTO-CREATE INVOICE ON INSTALL COMPLETE ==============
CREATE OR REPLACE FUNCTION public.create_invoice_on_install_complete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_deal RECORD;
  v_invoice_id UUID;
BEGIN
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN
    SELECT id, title, client_id, mrc, nrc INTO v_deal FROM public.deals WHERE id = NEW.deal_id;
    IF FOUND AND v_deal.client_id IS NOT NULL THEN
      -- Skip if an initial invoice already exists for this deal
      IF NOT EXISTS (SELECT 1 FROM public.invoices WHERE deal_id = v_deal.id AND kind = 'initial') THEN
        INSERT INTO public.invoices (
          deal_id, client_id, kind, status,
          mrc_amount, nrc_amount,
          period_start, period_end,
          notes
        ) VALUES (
          v_deal.id, v_deal.client_id, 'initial', 'draft',
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
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_install_create_invoice
  AFTER INSERT OR UPDATE OF status ON public.installations
  FOR EACH ROW EXECUTE FUNCTION public.create_invoice_on_install_complete();

-- ============== INVOICE STATUS CHANGE: NOTIFY + ACTIVATE BILLING ==============
CREATE OR REPLACE FUNCTION public.on_invoice_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_deal RECORD;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.log_audit('invoice', NEW.id, 'status_changed', 'status', OLD.status::text, NEW.status::text);

    -- When invoice is sent, mark sent_at and activate billing on deal
    IF NEW.status = 'sent' AND OLD.status = 'draft' THEN
      NEW.sent_at := COALESCE(NEW.sent_at, now());
      IF NEW.deal_id IS NOT NULL THEN
        SELECT id, title, assigned_to FROM public.deals WHERE id = NEW.deal_id INTO v_deal;
        IF FOUND THEN
          UPDATE public.deals SET billing_active_at = COALESCE(billing_active_at, now()) WHERE id = v_deal.id;
          PERFORM public.notify_user(
            v_deal.assigned_to,
            'invoice_sent',
            'Invoice Sent - ' || v_deal.title,
            'Invoice ' || NEW.invoice_number || ' has been sent. Total: ₵' || NEW.total::text,
            '/crm/finance/invoices',
            jsonb_build_object('invoice_id', NEW.id, 'deal_id', v_deal.id)
          );
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_invoice_status_change
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.on_invoice_status_change();

-- ============== RECURRING MONTHLY INVOICE GENERATOR ==============
CREATE OR REPLACE FUNCTION public.generate_monthly_recurring_invoices()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  d RECORD;
  v_period_start DATE;
  v_period_end DATE;
  v_count INTEGER := 0;
  v_invoice_id UUID;
BEGIN
  v_period_start := date_trunc('month', CURRENT_DATE)::date;
  v_period_end := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::date;

  FOR d IN
    SELECT id, client_id, mrc, title
    FROM public.deals
    WHERE billing_active_at IS NOT NULL
      AND mrc > 0
      AND client_id IS NOT NULL
  LOOP
    -- Skip if already invoiced for this period
    IF EXISTS (
      SELECT 1 FROM public.invoices
      WHERE deal_id = d.id
        AND kind = 'recurring'
        AND period_start = v_period_start
    ) THEN
      CONTINUE;
    END IF;

    INSERT INTO public.invoices (
      deal_id, client_id, kind, status,
      mrc_amount, nrc_amount,
      period_start, period_end,
      notes
    ) VALUES (
      d.id, d.client_id, 'recurring', 'draft',
      d.mrc, 0,
      v_period_start, v_period_end,
      'Recurring monthly invoice auto-generated.'
    ) RETURNING id INTO v_invoice_id;

    PERFORM public.log_audit('invoice', v_invoice_id, 'invoice_created', NULL, NULL, 'draft',
      jsonb_build_object('deal_id', d.id, 'recurring', true, 'period', v_period_start));

    v_count := v_count + 1;
  END LOOP;

  IF v_count > 0 THEN
    PERFORM public.notify_role(
      'finance_officer',
      'recurring_invoices',
      v_count::text || ' Recurring Invoices Generated',
      v_count::text || ' monthly invoices were drafted for ' || to_char(v_period_start, 'Mon YYYY') || '. Review and send.',
      '/crm/finance/invoices',
      jsonb_build_object('count', v_count, 'period', v_period_start)
    );
  END IF;

  RETURN v_count;
END;
$$;