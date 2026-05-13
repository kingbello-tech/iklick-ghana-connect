-- Add intake fields to leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS gps_address text,
  ADD COLUMN IF NOT EXISTS ghana_card_number text;

-- Intake links table: each sales rep gets a shareable token
CREATE TABLE IF NOT EXISTS public.intake_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_rep_id uuid NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(24), 'hex'),
  label text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intake_links_rep ON public.intake_links(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_intake_links_token ON public.intake_links(token);

ALTER TABLE public.intake_links ENABLE ROW LEVEL SECURITY;

-- Sales reps manage their own links; admins/sales managers see all
CREATE POLICY "Sales view own intake links"
  ON public.intake_links FOR SELECT TO authenticated
  USING (sales_rep_id = auth.uid() OR public.is_sales_manager_or_admin(auth.uid()));

CREATE POLICY "Sales create own intake links"
  ON public.intake_links FOR INSERT TO authenticated
  WITH CHECK (sales_rep_id = auth.uid() AND public.has_sales_access(auth.uid()));

CREATE POLICY "Sales update own intake links"
  ON public.intake_links FOR UPDATE TO authenticated
  USING (sales_rep_id = auth.uid() OR public.is_sales_manager_or_admin(auth.uid()))
  WITH CHECK (sales_rep_id = auth.uid() OR public.is_sales_manager_or_admin(auth.uid()));

CREATE POLICY "Admins delete intake links"
  ON public.intake_links FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR sales_rep_id = auth.uid());

-- Anon can read an active link by token (needed for public form to show rep name)
CREATE POLICY "Anon read active intake link by token"
  ON public.intake_links FOR SELECT TO anon
  USING (active = true);

CREATE TRIGGER trg_intake_links_updated
  BEFORE UPDATE ON public.intake_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Allow anon to insert a lead ONLY when source='intake_form' and assigned_to matches an active intake link
-- (Validation enforced via a trigger using sales_rep from token in metadata)
-- Simpler: edge function will use service role; no anon RLS on leads needed.
