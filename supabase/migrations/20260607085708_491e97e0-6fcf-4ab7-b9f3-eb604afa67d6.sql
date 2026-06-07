
-- Helper: is the user any non-viewer staff member
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text <> 'viewer'
  )
$$;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;

-- clients SELECT
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
CREATE POLICY "Staff can view clients" ON public.clients
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

-- client_contacts SELECT
DROP POLICY IF EXISTS "Authenticated view client contacts" ON public.client_contacts;
CREATE POLICY "Staff view client contacts" ON public.client_contacts
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

-- client_satisfaction SELECT
DROP POLICY IF EXISTS "Authenticated users can view satisfaction records" ON public.client_satisfaction;
CREATE POLICY "Staff view satisfaction records" ON public.client_satisfaction
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

-- client_satisfaction: remove anon direct insert (flow goes via submit_survey_response SECURITY DEFINER)
DROP POLICY IF EXISTS "Anon can submit survey" ON public.client_satisfaction;

-- survey_tokens SELECT — restrict to admin, CX, or token creator
DROP POLICY IF EXISTS "Authenticated users can view survey tokens" ON public.survey_tokens;
CREATE POLICY "Admin CX or creator view survey tokens" ON public.survey_tokens
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'client_experience'::app_role)
    OR created_by = auth.uid()
  );

-- Tighten can_access_attachment for incident / incident_note
CREATE OR REPLACE FUNCTION public.can_access_attachment(_entity_type text, _entity_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;

  IF _entity_type IN ('incident','incident_note') THEN
    RETURN has_role(uid, 'admin'::app_role)
        OR has_role(uid, 'client_experience'::app_role)
        OR has_technology_access(uid)
        OR has_role(uid, 'network_engineer'::app_role)
        OR has_role(uid, 'network_manager'::app_role)
        OR has_role(uid, 'support_agent'::app_role);
  ELSIF _entity_type = 'invoice' THEN
    RETURN public.has_finance_access(uid);
  ELSIF _entity_type = 'employee' THEN
    IF public.has_hr_access(uid) THEN RETURN true; END IF;
    RETURN EXISTS (SELECT 1 FROM public.employees e WHERE e.id = _entity_id AND e.user_id = uid);
  ELSIF _entity_type = 'site_survey' THEN
    RETURN public.has_technology_access(uid) OR public.has_sales_access(uid);
  ELSIF _entity_type = 'quotation' THEN
    RETURN public.has_sales_access(uid)
        OR public.is_sales_manager_or_admin(uid)
        OR public.has_technology_access(uid)
        OR public.has_finance_access(uid);
  END IF;
  RETURN false;
END;
$$;
