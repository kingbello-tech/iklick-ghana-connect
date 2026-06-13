
-- Helper: is user in technology department
CREATE OR REPLACE FUNCTION public.is_technology_user(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('technology_manager','technology_engineer','network_manager','network_engineer')
  )
$$;

-- Helper: is user in project management (service_delivery) department
CREATE OR REPLACE FUNCTION public.is_project_mgmt_user(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = 'service_delivery'
  )
$$;

-- Rewrite SELECT policy: only project mgmt + technology departments
DROP POLICY IF EXISTS "View projects by role and department" ON public.projects;
CREATE POLICY "View projects by role and department"
ON public.projects FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR owner_id = auth.uid()
  OR created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = projects.id AND pm.user_id = auth.uid())
  OR public.is_project_mgmt_user(auth.uid())
  OR public.is_technology_user(auth.uid())
);

-- Rewrite INSERT policy: only project mgmt or admin can create; owner must be a technology user
DROP POLICY IF EXISTS "Staff create projects" ON public.projects;
CREATE POLICY "Staff create projects"
ON public.projects FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR public.is_project_mgmt_user(auth.uid())
    OR public.is_technology_user(auth.uid())
  )
  AND department IN ('service_delivery','technology')
  AND owner_id IS NOT NULL
  AND public.is_technology_user(owner_id)
);

-- Rewrite UPDATE policy: project mgmt, technology managers, admin, or owner can update; if reassigning, new owner must be technology
DROP POLICY IF EXISTS "Managers update projects" ON public.projects;
CREATE POLICY "Managers update projects"
ON public.projects FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR public.is_project_mgmt_user(auth.uid())
  OR has_role(auth.uid(), 'technology_manager'::app_role)
  OR has_role(auth.uid(), 'network_manager'::app_role)
  OR owner_id = auth.uid()
)
WITH CHECK (
  department IN ('service_delivery','technology')
  AND (owner_id IS NULL OR public.is_technology_user(owner_id))
);

-- Update won-deal trigger: create projects under technology dept, assigned to a technology user
CREATE OR REPLACE FUNCTION public.create_project_on_won()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner uuid;
BEGIN
  IF NEW.stage = 'closed_won' AND (OLD.stage IS DISTINCT FROM 'closed_won') THEN
    IF NOT EXISTS (SELECT 1 FROM public.projects WHERE deal_id = NEW.id) THEN
      SELECT user_id INTO v_owner FROM public.user_roles
        WHERE role::text IN ('technology_manager','network_manager','technology_engineer','network_engineer')
        ORDER BY CASE role::text
          WHEN 'technology_manager' THEN 1
          WHEN 'network_manager' THEN 2
          WHEN 'technology_engineer' THEN 3
          WHEN 'network_engineer' THEN 4
        END, user_id LIMIT 1;
      IF v_owner IS NULL THEN
        SELECT user_id INTO v_owner FROM public.user_roles WHERE role::text = 'admin' LIMIT 1;
      END IF;
      v_owner := COALESCE(v_owner, NEW.assigned_to, NEW.created_by);

      INSERT INTO public.projects (name, client_id, deal_id, status, owner_id, created_by, start_date, department)
      VALUES (NEW.title, NEW.client_id, NEW.id, 'planning', v_owner, NEW.created_by, CURRENT_DATE, 'technology');

      PERFORM public.notify_user(
        v_owner, 'project_created',
        'New Project Assigned - ' || NEW.title,
        'A project has been auto-created from a won deal and assigned to you.',
        '/crm/projects',
        jsonb_build_object('deal_id', NEW.id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
