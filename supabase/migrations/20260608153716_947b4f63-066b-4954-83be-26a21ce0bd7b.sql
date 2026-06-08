DROP POLICY IF EXISTS "View projects by role and department" ON public.projects;

CREATE POLICY "View projects by role and department"
ON public.projects FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR owner_id = auth.uid()
  OR created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = projects.id AND pm.user_id = auth.uid())
  OR (department = 'service_delivery' AND has_role(auth.uid(), 'service_delivery'::app_role))
  OR (department = 'sales' AND (
        has_role(auth.uid(), 'sales_manager'::app_role)
     OR has_role(auth.uid(), 'sales_representative'::app_role)
  ))
  OR (department = 'technology' AND (
        has_role(auth.uid(), 'technology_manager'::app_role)
     OR has_role(auth.uid(), 'technology_engineer'::app_role)
     OR has_role(auth.uid(), 'network_manager'::app_role)
     OR has_role(auth.uid(), 'network_engineer'::app_role)
  ))
  OR (department = 'finance' AND has_role(auth.uid(), 'finance_officer'::app_role))
);