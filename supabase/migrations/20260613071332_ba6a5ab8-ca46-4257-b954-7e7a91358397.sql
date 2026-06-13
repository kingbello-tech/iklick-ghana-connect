
-- Allow service_delivery (project management) to manage projects/milestones as members
CREATE OR REPLACE FUNCTION public.is_project_member(_user_id uuid, _project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.project_members WHERE project_id = _project_id AND user_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = _project_id AND p.owner_id = _user_id)
      OR has_role(_user_id, 'admin'::app_role)
      OR has_role(_user_id, 'technology_manager'::app_role)
      OR has_role(_user_id, 'network_manager'::app_role)
      OR has_role(_user_id, 'service_delivery'::app_role);
$$;

-- Helper: can execute (work on tasks) — technology users + admins + owner
CREATE OR REPLACE FUNCTION public.can_execute_project(_user_id uuid, _project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT has_role(_user_id, 'admin'::app_role)
      OR public.is_technology_user(_user_id)
      OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = _project_id AND p.owner_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.project_members WHERE project_id = _project_id AND user_id = _user_id);
$$;

-- Tighten project_tasks: only technology (executors), admins, owner, members can create/update/delete
DROP POLICY IF EXISTS "Members create project tasks" ON public.project_tasks;
DROP POLICY IF EXISTS "Members update project tasks" ON public.project_tasks;
DROP POLICY IF EXISTS "Owners delete project tasks" ON public.project_tasks;

CREATE POLICY "Technology create project tasks"
ON public.project_tasks FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() AND public.can_execute_project(auth.uid(), project_id));

CREATE POLICY "Technology update project tasks"
ON public.project_tasks FOR UPDATE TO authenticated
USING (public.can_execute_project(auth.uid(), project_id) OR assigned_to = auth.uid())
WITH CHECK (public.can_execute_project(auth.uid(), project_id) OR assigned_to = auth.uid());

CREATE POLICY "Technology delete project tasks"
ON public.project_tasks FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR public.can_execute_project(auth.uid(), project_id));
