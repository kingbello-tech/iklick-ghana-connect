
-- Auto-create projects from won deals owned by Service Delivery (project manager), not the sales rep
CREATE OR REPLACE FUNCTION public.create_project_on_won()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pm uuid;
BEGIN
  IF NEW.stage = 'closed_won' AND (OLD.stage IS DISTINCT FROM 'closed_won') THEN
    IF NOT EXISTS (SELECT 1 FROM public.projects WHERE deal_id = NEW.id) THEN
      -- Pick a Service Delivery user (project manager) as owner; fallback to admin, then sales rep
      SELECT user_id INTO v_pm FROM public.user_roles
        WHERE role = 'service_delivery'::app_role
        ORDER BY user_id LIMIT 1;
      IF v_pm IS NULL THEN
        SELECT user_id INTO v_pm FROM public.user_roles
          WHERE role = 'admin'::app_role
          ORDER BY user_id LIMIT 1;
      END IF;
      v_pm := COALESCE(v_pm, NEW.assigned_to, NEW.created_by);

      INSERT INTO public.projects (name, client_id, deal_id, status, owner_id, created_by, start_date, department)
      VALUES (NEW.title, NEW.client_id, NEW.id, 'planning', v_pm, NEW.created_by, CURRENT_DATE, 'service_delivery');

      -- Notify the assigned project manager
      PERFORM public.notify_user(
        v_pm,
        'project_created',
        'New Project Assigned - ' || NEW.title,
        'A project has been auto-created from a won deal and assigned to you.',
        '/crm/projects',
        jsonb_build_object('deal_id', NEW.id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Broaden projects INSERT so any staff with a project-related role can create,
-- and explicitly allow service_delivery (project managers) to create projects.
DROP POLICY IF EXISTS "Managers create projects" ON public.projects;
CREATE POLICY "Staff create projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'service_delivery'::app_role)
    OR has_role(auth.uid(), 'technology_manager'::app_role)
    OR has_role(auth.uid(), 'network_manager'::app_role)
    OR has_role(auth.uid(), 'technology_engineer'::app_role)
    OR has_role(auth.uid(), 'network_engineer'::app_role)
    OR has_role(auth.uid(), 'sales_manager'::app_role)
    OR has_role(auth.uid(), 'sales_representative'::app_role)
  )
);
