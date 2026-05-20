
-- ============ Projects ============
CREATE TYPE public.project_status AS ENUM ('planning','active','on_hold','completed','cancelled');
CREATE TYPE public.project_health AS ENUM ('green','amber','red');
CREATE TYPE public.project_task_status AS ENUM ('backlog','todo','in_progress','review','done','blocked');
CREATE TYPE public.project_task_priority AS ENUM ('low','medium','high','critical');

CREATE SEQUENCE IF NOT EXISTS public.project_code_seq START 1;

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  status project_status NOT NULL DEFAULT 'planning',
  health project_health NOT NULL DEFAULT 'green',
  start_date date,
  target_end_date date,
  actual_end_date date,
  budget numeric(12,2) DEFAULT 0,
  owner_id uuid,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_projects_client ON public.projects(client_id);
CREATE INDEX idx_projects_deal ON public.projects(deal_id);
CREATE INDEX idx_projects_status ON public.projects(status);

CREATE OR REPLACE FUNCTION public.generate_project_code()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := 'PRJ-' || LPAD(nextval('public.project_code_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_projects_code BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.generate_project_code();

CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view projects"
  ON public.projects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers create projects"
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(),'admin'::app_role)
    OR has_role(auth.uid(),'technology_manager'::app_role)
    OR has_role(auth.uid(),'network_manager'::app_role)
    OR has_role(auth.uid(),'sales_manager'::app_role)
  );

CREATE POLICY "Managers update projects"
  ON public.projects FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(),'admin'::app_role)
    OR has_role(auth.uid(),'technology_manager'::app_role)
    OR has_role(auth.uid(),'network_manager'::app_role)
    OR has_role(auth.uid(),'sales_manager'::app_role)
    OR owner_id = auth.uid()
  )
  WITH CHECK (
    has_role(auth.uid(),'admin'::app_role)
    OR has_role(auth.uid(),'technology_manager'::app_role)
    OR has_role(auth.uid(),'network_manager'::app_role)
    OR has_role(auth.uid(),'sales_manager'::app_role)
    OR owner_id = auth.uid()
  );

CREATE POLICY "Admins delete projects"
  ON public.projects FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role));

-- ============ Project members ============
CREATE TABLE public.project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);
CREATE INDEX idx_project_members_project ON public.project_members(project_id);
CREATE INDEX idx_project_members_user ON public.project_members(user_id);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view members"
  ON public.project_members FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers manage members"
  ON public.project_members FOR ALL TO authenticated
  USING (
    has_role(auth.uid(),'admin'::app_role)
    OR has_role(auth.uid(),'technology_manager'::app_role)
    OR has_role(auth.uid(),'network_manager'::app_role)
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(),'admin'::app_role)
    OR has_role(auth.uid(),'technology_manager'::app_role)
    OR has_role(auth.uid(),'network_manager'::app_role)
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid())
  );

-- Helper: is the user a member or manager?
CREATE OR REPLACE FUNCTION public.is_project_member(_user_id uuid, _project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members WHERE project_id = _project_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id = _project_id AND p.owner_id = _user_id
  ) OR has_role(_user_id, 'admin'::app_role)
    OR has_role(_user_id, 'technology_manager'::app_role)
    OR has_role(_user_id, 'network_manager'::app_role);
$$;

-- ============ Milestones ============
CREATE TABLE public.project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  target_date date,
  completed_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'planned',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_milestones_project ON public.project_milestones(project_id);

CREATE TRIGGER trg_milestones_updated BEFORE UPDATE ON public.project_milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view milestones"
  ON public.project_milestones FOR SELECT TO authenticated USING (true);

CREATE POLICY "Members manage milestones"
  ON public.project_milestones FOR ALL TO authenticated
  USING (is_project_member(auth.uid(), project_id))
  WITH CHECK (is_project_member(auth.uid(), project_id));

-- ============ Tasks ============
CREATE TABLE public.project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id uuid REFERENCES public.project_milestones(id) ON DELETE SET NULL,
  incident_id uuid REFERENCES public.incidents(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status project_task_status NOT NULL DEFAULT 'todo',
  priority project_task_priority NOT NULL DEFAULT 'medium',
  assigned_to uuid,
  due_date date,
  estimate_hours numeric(6,2),
  sort_order integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_project_tasks_project ON public.project_tasks(project_id);
CREATE INDEX idx_project_tasks_status ON public.project_tasks(status);
CREATE INDEX idx_project_tasks_assignee ON public.project_tasks(assigned_to) WHERE status <> 'done';

CREATE TRIGGER trg_project_tasks_updated BEFORE UPDATE ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view project tasks"
  ON public.project_tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Members create project tasks"
  ON public.project_tasks FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND is_project_member(auth.uid(), project_id));

CREATE POLICY "Members update project tasks"
  ON public.project_tasks FOR UPDATE TO authenticated
  USING (is_project_member(auth.uid(), project_id) OR assigned_to = auth.uid())
  WITH CHECK (is_project_member(auth.uid(), project_id) OR assigned_to = auth.uid());

CREATE POLICY "Owners delete project tasks"
  ON public.project_tasks FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR created_by = auth.uid());

-- ============ Project time entries ============
CREATE TABLE public.project_time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.project_tasks(id) ON DELETE SET NULL,
  logged_by uuid NOT NULL,
  minutes integer NOT NULL CHECK (minutes > 0),
  billable boolean NOT NULL DEFAULT false,
  worked_on date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_project_time_project ON public.project_time_entries(project_id);

ALTER TABLE public.project_time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view project time"
  ON public.project_time_entries FOR SELECT TO authenticated USING (true);

CREATE POLICY "Members log project time"
  ON public.project_time_entries FOR INSERT TO authenticated
  WITH CHECK (logged_by = auth.uid() AND is_project_member(auth.uid(), project_id));

CREATE POLICY "Owners delete project time"
  ON public.project_time_entries FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR logged_by = auth.uid());

-- ============ Project comments ============
CREATE TABLE public.project_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_project_comments_project ON public.project_comments(project_id);

ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view project comments"
  ON public.project_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Members comment"
  ON public.project_comments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_project_member(auth.uid(), project_id));

CREATE POLICY "Owners delete comments"
  ON public.project_comments FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR user_id = auth.uid());

-- ============ Auto-create project when deal becomes closed_won ============
CREATE OR REPLACE FUNCTION public.create_project_on_won()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.stage = 'closed_won' AND (OLD.stage IS DISTINCT FROM 'closed_won') THEN
    IF NOT EXISTS (SELECT 1 FROM public.projects WHERE deal_id = NEW.id) THEN
      INSERT INTO public.projects (name, client_id, deal_id, status, owner_id, created_by, start_date)
      VALUES (
        NEW.title,
        NEW.client_id,
        NEW.id,
        'planning',
        NEW.assigned_to,
        NEW.created_by,
        CURRENT_DATE
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_deal_create_project
  AFTER UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.create_project_on_won();
