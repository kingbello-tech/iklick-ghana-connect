ALTER TABLE public.attachments DROP CONSTRAINT IF EXISTS attachments_entity_type_check;
ALTER TABLE public.attachments ADD CONSTRAINT attachments_entity_type_check
  CHECK (entity_type = ANY (ARRAY['incident','incident_note','invoice','employee','quotation','site_survey']));

DROP POLICY IF EXISTS "Admins can delete quotations" ON public.quotations;
CREATE POLICY "Sales users can delete quotations" ON public.quotations
  FOR DELETE TO authenticated
  USING (public.has_sales_access(auth.uid()) OR public.is_sales_manager_or_admin(auth.uid()));