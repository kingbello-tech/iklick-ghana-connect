
-- 1. Migrate support_agent users to network_engineer (enum value kept for compat)
UPDATE public.user_roles SET role='network_engineer'::app_role WHERE role='support_agent'::app_role;

-- 2. Backfill department='Technology' for Technology dept roles
UPDATE public.profiles SET department='Technology'
WHERE department IS NULL OR department = ''
   OR user_id IN (
     SELECT user_id FROM public.user_roles
     WHERE role::text IN ('technology_manager','technology_engineer','network_manager','network_engineer','client_experience')
   );

UPDATE public.profiles p
SET department='Technology'
FROM public.user_roles ur
WHERE ur.user_id = p.user_id
  AND ur.role::text IN ('technology_manager','technology_engineer','network_manager','network_engineer','client_experience');

-- 3. Update incidents RLS: add network_engineer/network_manager for INSERT/UPDATE; remove client_experience from INSERT
DROP POLICY IF EXISTS "Technology creates incidents" ON public.incidents;
CREATE POLICY "Technology creates incidents" ON public.incidents
FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(),'admin') OR
  has_role(auth.uid(),'technology_manager') OR
  has_role(auth.uid(),'technology_engineer') OR
  has_role(auth.uid(),'network_manager') OR
  has_role(auth.uid(),'network_engineer')
);

DROP POLICY IF EXISTS "Technology updates incidents" ON public.incidents;
CREATE POLICY "Technology updates incidents" ON public.incidents
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(),'admin') OR
  has_role(auth.uid(),'technology_manager') OR
  has_role(auth.uid(),'technology_engineer') OR
  has_role(auth.uid(),'network_manager') OR
  has_role(auth.uid(),'network_engineer') OR
  has_role(auth.uid(),'client_experience')
) WITH CHECK (
  has_role(auth.uid(),'admin') OR
  has_role(auth.uid(),'technology_manager') OR
  has_role(auth.uid(),'technology_engineer') OR
  has_role(auth.uid(),'network_manager') OR
  has_role(auth.uid(),'network_engineer') OR
  has_role(auth.uid(),'client_experience')
);

-- Update closure helper to include network roles
CREATE OR REPLACE FUNCTION public.can_close_incident(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin','client_experience','technology_manager','technology_engineer','network_manager','network_engineer')
  )
$$;

-- 4. incident_notes / history / closures / tasks / time_entries / approvals: allow network roles
DROP POLICY IF EXISTS "Technology creates incident notes" ON public.incident_notes;
CREATE POLICY "Technology creates incident notes" ON public.incident_notes
FOR INSERT TO authenticated WITH CHECK (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'technology_manager') OR has_role(auth.uid(),'technology_engineer')
  OR has_role(auth.uid(),'network_manager') OR has_role(auth.uid(),'network_engineer') OR has_role(auth.uid(),'client_experience')
);

DROP POLICY IF EXISTS "Technology creates incident history" ON public.incident_history;
CREATE POLICY "Technology creates incident history" ON public.incident_history
FOR INSERT TO authenticated WITH CHECK (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'technology_manager') OR has_role(auth.uid(),'technology_engineer')
  OR has_role(auth.uid(),'network_manager') OR has_role(auth.uid(),'network_engineer') OR has_role(auth.uid(),'client_experience')
);

DROP POLICY IF EXISTS "Technology creates closures" ON public.incident_closures;
CREATE POLICY "Technology creates closures" ON public.incident_closures
FOR INSERT TO authenticated WITH CHECK (
  (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'technology_manager') OR has_role(auth.uid(),'technology_engineer')
   OR has_role(auth.uid(),'network_manager') OR has_role(auth.uid(),'network_engineer') OR has_role(auth.uid(),'client_experience'))
  AND closed_by = auth.uid()
);

DROP POLICY IF EXISTS "Technology create incident tasks" ON public.incident_tasks;
CREATE POLICY "Technology create incident tasks" ON public.incident_tasks
FOR INSERT TO authenticated WITH CHECK (
  created_by = auth.uid() AND (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'technology_manager') OR has_role(auth.uid(),'technology_engineer')
    OR has_role(auth.uid(),'network_manager') OR has_role(auth.uid(),'network_engineer')
  )
);

DROP POLICY IF EXISTS "Technology log time" ON public.incident_time_entries;
CREATE POLICY "Technology log time" ON public.incident_time_entries
FOR INSERT TO authenticated WITH CHECK (
  logged_by = auth.uid() AND (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'technology_manager') OR has_role(auth.uid(),'technology_engineer')
    OR has_role(auth.uid(),'network_manager') OR has_role(auth.uid(),'network_engineer')
  )
);

DROP POLICY IF EXISTS "Technology request approvals" ON public.incident_approvals;
CREATE POLICY "Technology request approvals" ON public.incident_approvals
FOR INSERT TO authenticated WITH CHECK (
  requested_by = auth.uid() AND (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'technology_engineer') OR has_role(auth.uid(),'technology_manager')
    OR has_role(auth.uid(),'network_manager') OR has_role(auth.uid(),'network_engineer') OR has_role(auth.uid(),'client_experience')
  )
);

-- 5. client_contacts table
CREATE TABLE IF NOT EXISTS public.client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_client_contacts_client ON public.client_contacts(client_id);

ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view client contacts" ON public.client_contacts
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff manage client contacts" ON public.client_contacts
FOR INSERT TO authenticated WITH CHECK (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'network_manager') OR has_role(auth.uid(),'network_engineer')
  OR has_role(auth.uid(),'technology_manager') OR has_role(auth.uid(),'technology_engineer')
  OR has_role(auth.uid(),'client_experience') OR has_sales_access(auth.uid())
);

CREATE POLICY "Staff update client contacts" ON public.client_contacts
FOR UPDATE TO authenticated USING (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'network_manager') OR has_role(auth.uid(),'network_engineer')
  OR has_role(auth.uid(),'technology_manager') OR has_role(auth.uid(),'technology_engineer')
  OR has_role(auth.uid(),'client_experience') OR has_sales_access(auth.uid())
) WITH CHECK (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'network_manager') OR has_role(auth.uid(),'network_engineer')
  OR has_role(auth.uid(),'technology_manager') OR has_role(auth.uid(),'technology_engineer')
  OR has_role(auth.uid(),'client_experience') OR has_sales_access(auth.uid())
);

CREATE POLICY "Staff delete client contacts" ON public.client_contacts
FOR DELETE TO authenticated USING (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'network_manager')
  OR has_role(auth.uid(),'technology_manager') OR has_role(auth.uid(),'client_experience')
);

CREATE TRIGGER trg_client_contacts_updated_at
BEFORE UPDATE ON public.client_contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
