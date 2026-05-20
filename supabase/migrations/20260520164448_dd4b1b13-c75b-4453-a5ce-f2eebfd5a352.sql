
-- ============ Request categories (hierarchical) ============
CREATE TABLE public.request_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES public.request_categories(id) ON DELETE CASCADE,
  description text,
  icon text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_request_categories_parent ON public.request_categories(parent_id);

ALTER TABLE public.request_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view categories"
  ON public.request_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers manage categories"
  ON public.request_categories FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'network_manager'::app_role) OR has_role(auth.uid(),'client_experience'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'network_manager'::app_role) OR has_role(auth.uid(),'client_experience'::app_role));

CREATE TRIGGER trg_request_categories_updated
  BEFORE UPDATE ON public.request_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Request templates ============
CREATE TABLE public.request_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid REFERENCES public.request_categories(id) ON DELETE SET NULL,
  title_template text NOT NULL,
  description_template text,
  default_priority incident_priority NOT NULL DEFAULT 'medium',
  default_impact text,
  default_urgency text,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_request_templates_category ON public.request_templates(category_id);

ALTER TABLE public.request_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view templates"
  ON public.request_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers manage templates"
  ON public.request_templates FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'network_manager'::app_role) OR has_role(auth.uid(),'client_experience'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'network_manager'::app_role) OR has_role(auth.uid(),'client_experience'::app_role));

CREATE TRIGGER trg_request_templates_updated
  BEFORE UPDATE ON public.request_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Extend incidents ============
ALTER TABLE public.incidents
  ADD COLUMN category_id uuid REFERENCES public.request_categories(id) ON DELETE SET NULL,
  ADD COLUMN template_id uuid REFERENCES public.request_templates(id) ON DELETE SET NULL,
  ADD COLUMN sub_category text,
  ADD COLUMN impact text,
  ADD COLUMN urgency text,
  ADD COLUMN due_at timestamptz,
  ADD COLUMN first_response_at timestamptz,
  ADD COLUMN reopened_count integer NOT NULL DEFAULT 0,
  ADD COLUMN source text NOT NULL DEFAULT 'portal';

CREATE INDEX idx_incidents_category ON public.incidents(category_id);
CREATE INDEX idx_incidents_due_at ON public.incidents(due_at) WHERE status NOT IN ('closed','resolved');

-- ============ Incident approvals ============
CREATE TABLE public.incident_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL,
  approver_id uuid,
  reason text NOT NULL,
  decision text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  decision_comment text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_incident_approvals_incident ON public.incident_approvals(incident_id);
CREATE INDEX idx_incident_approvals_pending ON public.incident_approvals(decision) WHERE decision = 'pending';

ALTER TABLE public.incident_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view approvals"
  ON public.incident_approvals FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff request approvals"
  ON public.incident_approvals FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid() AND (
    has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'network_engineer'::app_role)
    OR has_role(auth.uid(),'support_agent'::app_role) OR has_role(auth.uid(),'network_manager'::app_role)
    OR has_role(auth.uid(),'client_experience'::app_role)
  ));

CREATE POLICY "Approvers decide"
  ON public.incident_approvals FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'network_manager'::app_role) OR has_role(auth.uid(),'client_experience'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'network_manager'::app_role) OR has_role(auth.uid(),'client_experience'::app_role));

CREATE POLICY "Admins delete approvals"
  ON public.incident_approvals FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_incident_approvals_updated
  BEFORE UPDATE ON public.incident_approvals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Incident tasks ============
CREATE TABLE public.incident_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assigned_to uuid,
  status text NOT NULL DEFAULT 'open', -- open | in_progress | done | cancelled
  due_date date,
  completed_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_incident_tasks_incident ON public.incident_tasks(incident_id);
CREATE INDEX idx_incident_tasks_assigned ON public.incident_tasks(assigned_to) WHERE status <> 'done';

ALTER TABLE public.incident_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view incident tasks"
  ON public.incident_tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff create incident tasks"
  ON public.incident_tasks FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND (
    has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'network_engineer'::app_role)
    OR has_role(auth.uid(),'support_agent'::app_role) OR has_role(auth.uid(),'network_manager'::app_role)
    OR has_role(auth.uid(),'client_experience'::app_role)
  ));

CREATE POLICY "Staff update incident tasks"
  ON public.incident_tasks FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'network_manager'::app_role)
    OR assigned_to = auth.uid() OR created_by = auth.uid()
  )
  WITH CHECK (
    has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'network_manager'::app_role)
    OR assigned_to = auth.uid() OR created_by = auth.uid()
  );

CREATE POLICY "Owners delete incident tasks"
  ON public.incident_tasks FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR created_by = auth.uid());

CREATE TRIGGER trg_incident_tasks_updated
  BEFORE UPDATE ON public.incident_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Incident time entries ============
CREATE TABLE public.incident_time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  logged_by uuid NOT NULL,
  minutes integer NOT NULL CHECK (minutes > 0),
  billable boolean NOT NULL DEFAULT false,
  worked_on date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_incident_time_incident ON public.incident_time_entries(incident_id);
CREATE INDEX idx_incident_time_user ON public.incident_time_entries(logged_by);

ALTER TABLE public.incident_time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view time entries"
  ON public.incident_time_entries FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff log time"
  ON public.incident_time_entries FOR INSERT TO authenticated
  WITH CHECK (logged_by = auth.uid() AND (
    has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'network_engineer'::app_role)
    OR has_role(auth.uid(),'support_agent'::app_role) OR has_role(auth.uid(),'network_manager'::app_role)
    OR has_role(auth.uid(),'client_experience'::app_role)
  ));

CREATE POLICY "Owners delete time entries"
  ON public.incident_time_entries FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR logged_by = auth.uid());

-- ============ Auto-set due_at from SLA policy on incident insert ============
CREATE OR REPLACE FUNCTION public.set_incident_due_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_res_minutes integer;
BEGIN
  IF NEW.due_at IS NULL THEN
    SELECT resolution_time_minutes INTO v_res_minutes
    FROM public.sla_policies WHERE priority = NEW.priority LIMIT 1;
    IF v_res_minutes IS NOT NULL THEN
      NEW.due_at := NEW.created_at + make_interval(mins => v_res_minutes);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_incidents_set_due_at
  BEFORE INSERT ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.set_incident_due_at();
