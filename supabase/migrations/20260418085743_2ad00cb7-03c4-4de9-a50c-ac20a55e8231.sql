DROP POLICY IF EXISTS "Finance create invoices" ON public.invoices;

CREATE POLICY "Finance create invoices"
  ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (public.has_finance_access(auth.uid()));