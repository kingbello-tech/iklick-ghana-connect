CREATE OR REPLACE FUNCTION public.can_access_attachment(_entity_type text, _entity_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;

  IF _entity_type IN ('incident','incident_note') THEN
    RETURN true;
  ELSIF _entity_type = 'invoice' THEN
    RETURN public.has_finance_access(uid);
  ELSIF _entity_type = 'employee' THEN
    IF public.has_hr_access(uid) THEN RETURN true; END IF;
    RETURN EXISTS (SELECT 1 FROM public.employees e WHERE e.id = _entity_id AND e.user_id = uid);
  ELSIF _entity_type = 'site_survey' THEN
    RETURN public.has_technology_access(uid)
        OR public.has_sales_access(uid);
  ELSIF _entity_type = 'quotation' THEN
    RETURN public.has_sales_access(uid)
        OR public.is_sales_manager_or_admin(uid)
        OR public.has_technology_access(uid)
        OR public.has_finance_access(uid);
  END IF;
  RETURN false;
END;
$$;