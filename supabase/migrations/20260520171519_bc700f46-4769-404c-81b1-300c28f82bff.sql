
-- =========================================================
-- 1) LEADS: scope to owner for sales reps
-- =========================================================
DROP POLICY IF EXISTS "Sales users can view leads" ON public.leads;
DROP POLICY IF EXISTS "Sales users can update leads" ON public.leads;

CREATE POLICY "Leads: managers see all, reps see own"
ON public.leads FOR SELECT TO authenticated
USING (
  public.is_sales_manager_or_admin(auth.uid())
  OR (public.has_sales_access(auth.uid()) AND (assigned_to = auth.uid() OR created_by = auth.uid()))
);

CREATE POLICY "Leads: managers update all, reps update own"
ON public.leads FOR UPDATE TO authenticated
USING (
  public.is_sales_manager_or_admin(auth.uid())
  OR (public.has_sales_access(auth.uid()) AND (assigned_to = auth.uid() OR created_by = auth.uid()))
)
WITH CHECK (
  public.is_sales_manager_or_admin(auth.uid())
  OR (public.has_sales_access(auth.uid()) AND (assigned_to = auth.uid() OR created_by = auth.uid()))
);

-- =========================================================
-- 2) DEALS: scope to owner for sales reps
-- =========================================================
DROP POLICY IF EXISTS "Sales users can view deals" ON public.deals;
DROP POLICY IF EXISTS "Sales users can update deals" ON public.deals;

CREATE POLICY "Deals: managers see all, reps see own"
ON public.deals FOR SELECT TO authenticated
USING (
  public.is_sales_manager_or_admin(auth.uid())
  OR public.has_technology_access(auth.uid())
  OR public.has_finance_access(auth.uid())
  OR (public.has_sales_access(auth.uid()) AND (assigned_to = auth.uid() OR created_by = auth.uid()))
);

CREATE POLICY "Deals: managers update all, reps update own"
ON public.deals FOR UPDATE TO authenticated
USING (
  public.is_sales_manager_or_admin(auth.uid())
  OR (public.has_sales_access(auth.uid()) AND (assigned_to = auth.uid() OR created_by = auth.uid()))
)
WITH CHECK (
  public.is_sales_manager_or_admin(auth.uid())
  OR (public.has_sales_access(auth.uid()) AND (assigned_to = auth.uid() OR created_by = auth.uid()))
);

-- =========================================================
-- 3) DEAL ACTIVITIES: scope via parent deal
-- =========================================================
DROP POLICY IF EXISTS "Sales users can view activities" ON public.deal_activities;
DROP POLICY IF EXISTS "Sales users can update activities" ON public.deal_activities;

CREATE POLICY "Deal activities: scoped view"
ON public.deal_activities FOR SELECT TO authenticated
USING (
  public.is_sales_manager_or_admin(auth.uid())
  OR (
    public.has_sales_access(auth.uid())
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.deals d
        WHERE d.id = deal_activities.deal_id
          AND (d.assigned_to = auth.uid() OR d.created_by = auth.uid())
      )
    )
  )
);

CREATE POLICY "Deal activities: scoped update"
ON public.deal_activities FOR UPDATE TO authenticated
USING (
  public.is_sales_manager_or_admin(auth.uid())
  OR user_id = auth.uid()
)
WITH CHECK (
  public.is_sales_manager_or_admin(auth.uid())
  OR user_id = auth.uid()
);

-- =========================================================
-- 4) INCIDENTS: Technology department only for write ops
-- =========================================================
DROP POLICY IF EXISTS "Staff can create incidents" ON public.incidents;
DROP POLICY IF EXISTS "Staff can update incidents" ON public.incidents;
DROP POLICY IF EXISTS "Network managers can create incidents" ON public.incidents;
DROP POLICY IF EXISTS "Network managers can update incidents" ON public.incidents;

CREATE POLICY "Technology creates incidents"
ON public.incidents FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'technology_engineer'::app_role)
  OR public.has_role(auth.uid(), 'technology_manager'::app_role)
);

CREATE POLICY "Technology updates incidents"
ON public.incidents FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'technology_engineer'::app_role)
  OR public.has_role(auth.uid(), 'technology_manager'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'technology_engineer'::app_role)
  OR public.has_role(auth.uid(), 'technology_manager'::app_role)
);

-- Incident notes
DROP POLICY IF EXISTS "Staff can create notes" ON public.incident_notes;
DROP POLICY IF EXISTS "Network managers can create notes" ON public.incident_notes;
CREATE POLICY "Technology creates incident notes"
ON public.incident_notes FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'technology_engineer'::app_role)
  OR public.has_role(auth.uid(), 'technology_manager'::app_role)
  OR public.has_role(auth.uid(), 'client_experience'::app_role)
);

-- Incident history
DROP POLICY IF EXISTS "Staff can create history" ON public.incident_history;
DROP POLICY IF EXISTS "Network managers can create history" ON public.incident_history;
DROP POLICY IF EXISTS "CX and managers can create history" ON public.incident_history;
CREATE POLICY "Technology creates incident history"
ON public.incident_history FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'technology_engineer'::app_role)
  OR public.has_role(auth.uid(), 'technology_manager'::app_role)
  OR public.has_role(auth.uid(), 'client_experience'::app_role)
);

-- Incident closures
DROP POLICY IF EXISTS "Resolution roles create closures" ON public.incident_closures;
CREATE POLICY "Technology creates closures"
ON public.incident_closures FOR INSERT TO authenticated
WITH CHECK (
  (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'technology_engineer'::app_role)
    OR public.has_role(auth.uid(), 'technology_manager'::app_role)
    OR public.has_role(auth.uid(), 'client_experience'::app_role)
  ) AND closed_by = auth.uid()
);

-- Incident tasks
DROP POLICY IF EXISTS "Staff create incident tasks" ON public.incident_tasks;
DROP POLICY IF EXISTS "Staff update incident tasks" ON public.incident_tasks;
CREATE POLICY "Technology create incident tasks"
ON public.incident_tasks FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid() AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'technology_engineer'::app_role)
    OR public.has_role(auth.uid(), 'technology_manager'::app_role)
  )
);
CREATE POLICY "Technology update incident tasks"
ON public.incident_tasks FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'technology_manager'::app_role)
  OR assigned_to = auth.uid()
  OR created_by = auth.uid()
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'technology_manager'::app_role)
  OR assigned_to = auth.uid()
  OR created_by = auth.uid()
);

-- Incident time entries
DROP POLICY IF EXISTS "Staff log time" ON public.incident_time_entries;
CREATE POLICY "Technology log time"
ON public.incident_time_entries FOR INSERT TO authenticated
WITH CHECK (
  logged_by = auth.uid() AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'technology_engineer'::app_role)
    OR public.has_role(auth.uid(), 'technology_manager'::app_role)
  )
);

-- Incident approvals
DROP POLICY IF EXISTS "Staff request approvals" ON public.incident_approvals;
DROP POLICY IF EXISTS "Approvers decide" ON public.incident_approvals;
CREATE POLICY "Technology request approvals"
ON public.incident_approvals FOR INSERT TO authenticated
WITH CHECK (
  requested_by = auth.uid() AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'technology_engineer'::app_role)
    OR public.has_role(auth.uid(), 'technology_manager'::app_role)
    OR public.has_role(auth.uid(), 'client_experience'::app_role)
  )
);
CREATE POLICY "Approvers decide approvals"
ON public.incident_approvals FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'technology_manager'::app_role)
  OR public.has_role(auth.uid(), 'client_experience'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'technology_manager'::app_role)
  OR public.has_role(auth.uid(), 'client_experience'::app_role)
);

-- Also broaden close authorization helper to include technology roles
CREATE OR REPLACE FUNCTION public.can_close_incident(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin','client_experience','technology_manager','technology_engineer')
  )
$$;

-- =========================================================
-- 5) Site survey attachments: extend can_access_attachment
-- =========================================================
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
  END IF;
  RETURN false;
END;
$$;
