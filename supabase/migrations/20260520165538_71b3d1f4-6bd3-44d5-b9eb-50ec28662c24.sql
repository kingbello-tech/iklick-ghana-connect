
-- Phase 4: Sales gates + Billing rewire

-- Deal approvals (e.g., discount > threshold)
CREATE TYPE public.approval_status AS ENUM ('pending','approved','rejected');

CREATE TABLE public.deal_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  discount_pct NUMERIC(5,2),
  requested_by UUID,
  approver_id UUID,
  status public.approval_status NOT NULL DEFAULT 'pending',
  decided_at TIMESTAMPTZ,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sales view deal approvals" ON public.deal_approvals
  FOR SELECT TO authenticated USING (public.has_sales_access(auth.uid()));
CREATE POLICY "Sales request deal approval" ON public.deal_approvals
  FOR INSERT TO authenticated WITH CHECK (public.has_sales_access(auth.uid()) AND requested_by = auth.uid());
CREATE POLICY "Managers decide deal approvals" ON public.deal_approvals
  FOR UPDATE TO authenticated USING (public.is_sales_manager_or_admin(auth.uid()));

-- Invoice approvals: extend invoice_status enum
ALTER TYPE public.invoice_status ADD VALUE IF NOT EXISTS 'pending_approval';
ALTER TYPE public.invoice_status ADD VALUE IF NOT EXISTS 'approved';

-- Add approval-tracking columns on invoices
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS approval_required BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_by UUID,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_count INTEGER NOT NULL DEFAULT 0;

-- Approval threshold setting (simple constant function)
CREATE OR REPLACE FUNCTION public.invoice_approval_threshold()
RETURNS NUMERIC LANGUAGE sql IMMUTABLE AS $$ SELECT 10000::numeric $$;

-- Flag invoices >= threshold as needing approval at insert
CREATE OR REPLACE FUNCTION public.flag_invoice_approval()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.total >= public.invoice_approval_threshold() THEN
    NEW.approval_required := true;
    IF NEW.status = 'draft' THEN
      NEW.status := 'pending_approval';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_flag_invoice_approval ON public.invoices;
CREATE TRIGGER trg_flag_invoice_approval
  BEFORE INSERT OR UPDATE OF total ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.flag_invoice_approval();

-- Prevent sending an invoice that still requires approval
CREATE OR REPLACE FUNCTION public.guard_invoice_send()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.status = 'sent' AND NEW.approval_required = true AND NEW.approved_at IS NULL THEN
    RAISE EXCEPTION 'Invoice % requires approval before sending', NEW.invoice_number;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_guard_invoice_send ON public.invoices;
CREATE TRIGGER trg_guard_invoice_send
  BEFORE UPDATE OF status ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.guard_invoice_send();

-- Sales stage-gate validation
CREATE OR REPLACE FUNCTION public.validate_deal_stage_transition()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.stage IS DISTINCT FROM NEW.stage THEN
    -- negotiation requires at least one quotation
    IF NEW.stage = 'negotiation' AND NOT EXISTS (
      SELECT 1 FROM public.quotations WHERE deal_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Cannot move to negotiation: a quotation is required';
    END IF;

    -- closed_won requires an accepted quotation and completed site survey
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
END $$;

DROP TRIGGER IF EXISTS trg_validate_deal_stage ON public.deals;
CREATE TRIGGER trg_validate_deal_stage
  BEFORE UPDATE OF stage ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.validate_deal_stage_transition();

-- Dunning: mark overdue invoices
CREATE OR REPLACE FUNCTION public.dunning_sweep()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_count INTEGER := 0; r RECORD;
BEGIN
  FOR r IN
    SELECT id, invoice_number, deal_id, client_id, balance_due, due_date
    FROM public.invoices
    WHERE status IN ('sent','partially_paid')
      AND due_date IS NOT NULL AND due_date < CURRENT_DATE
      AND balance_due > 0
  LOOP
    UPDATE public.invoices
      SET status = 'overdue',
          last_reminder_at = now(),
          reminder_count = reminder_count + 1
      WHERE id = r.id;

    PERFORM public.log_audit('invoice', r.id, 'marked_overdue', 'status', 'sent', 'overdue',
      jsonb_build_object('balance_due', r.balance_due));

    PERFORM public.notify_role('finance_officer','invoice_overdue',
      'Invoice Overdue: '||r.invoice_number,
      'Balance ₵'||r.balance_due::text||' is past due ('||r.due_date::text||').',
      '/crm/finance/invoices',
      jsonb_build_object('invoice_id', r.id));
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END $$;
