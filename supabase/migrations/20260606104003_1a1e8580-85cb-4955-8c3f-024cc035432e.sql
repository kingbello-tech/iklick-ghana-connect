
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS department text;
UPDATE public.projects SET department = 'service_delivery' WHERE department IS NULL;

CREATE OR REPLACE FUNCTION public.has_service_delivery_access(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text IN ('admin', 'service_delivery')
  )
$$;

DROP POLICY IF EXISTS "Authenticated view projects" ON public.projects;
CREATE POLICY "View projects by role and department"
ON public.projects FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR owner_id = auth.uid()
  OR created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = id AND pm.user_id = auth.uid())
  OR (department = 'service_delivery' AND has_role(auth.uid(), 'service_delivery'::app_role))
  OR (department = 'sales' AND has_role(auth.uid(), 'sales_manager'::app_role))
  OR (department = 'technology' AND (has_role(auth.uid(), 'technology_manager'::app_role) OR has_role(auth.uid(), 'network_manager'::app_role)))
  OR (department = 'finance' AND has_role(auth.uid(), 'finance_officer'::app_role))
);

DROP POLICY IF EXISTS "Managers create projects" ON public.projects;
CREATE POLICY "Managers create projects"
ON public.projects FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'technology_manager'::app_role)
  OR has_role(auth.uid(), 'network_manager'::app_role)
  OR has_role(auth.uid(), 'sales_manager'::app_role)
  OR has_role(auth.uid(), 'service_delivery'::app_role)
);

DROP POLICY IF EXISTS "Managers update projects" ON public.projects;
CREATE POLICY "Managers update projects"
ON public.projects FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'technology_manager'::app_role)
  OR has_role(auth.uid(), 'network_manager'::app_role)
  OR has_role(auth.uid(), 'sales_manager'::app_role)
  OR (has_role(auth.uid(), 'service_delivery'::app_role) AND department = 'service_delivery')
  OR owner_id = auth.uid()
);

CREATE OR REPLACE FUNCTION public.create_project_on_won()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.stage = 'closed_won' AND (OLD.stage IS DISTINCT FROM 'closed_won') THEN
    IF NOT EXISTS (SELECT 1 FROM public.projects WHERE deal_id = NEW.id) THEN
      INSERT INTO public.projects (name, client_id, deal_id, status, owner_id, created_by, start_date, department)
      VALUES (NEW.title, NEW.client_id, NEW.id, 'planning', NEW.assigned_to, NEW.created_by, CURRENT_DATE, 'service_delivery');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
