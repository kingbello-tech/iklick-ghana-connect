CREATE OR REPLACE FUNCTION public.is_explicit_project_member(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = _project_id
      AND pm.user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_project_owner(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = _project_id
      AND p.owner_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_project_member(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.is_explicit_project_member(_user_id, _project_id)
      OR public.is_project_owner(_user_id, _project_id)
      OR public.has_role(_user_id, 'admin'::app_role)
      OR public.is_technology_user(_user_id)
      OR public.is_project_mgmt_user(_user_id)
$$;

CREATE OR REPLACE FUNCTION public.can_execute_project(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role)
      OR public.is_technology_user(_user_id)
      OR public.is_project_owner(_user_id, _project_id)
      OR public.is_explicit_project_member(_user_id, _project_id)
$$;

DROP POLICY IF EXISTS "View projects by role and department" ON public.projects;
CREATE POLICY "View projects by role and department"
ON public.projects FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR owner_id = auth.uid()
  OR created_by = auth.uid()
  OR public.is_explicit_project_member(auth.uid(), id)
  OR public.is_project_mgmt_user(auth.uid())
  OR public.is_technology_user(auth.uid())
);

DROP POLICY IF EXISTS "Managers manage members" ON public.project_members;

CREATE POLICY "Managers add project members"
ON public.project_members FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_technology_user(auth.uid())
  OR public.is_project_mgmt_user(auth.uid())
  OR public.is_project_owner(auth.uid(), project_id)
);

CREATE POLICY "Managers update project members"
ON public.project_members FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_technology_user(auth.uid())
  OR public.is_project_mgmt_user(auth.uid())
  OR public.is_project_owner(auth.uid(), project_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_technology_user(auth.uid())
  OR public.is_project_mgmt_user(auth.uid())
  OR public.is_project_owner(auth.uid(), project_id)
);

CREATE POLICY "Managers remove project members"
ON public.project_members FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_technology_user(auth.uid())
  OR public.is_project_mgmt_user(auth.uid())
  OR public.is_project_owner(auth.uid(), project_id)
);