
-- Problem record status enum
DO $$ BEGIN
  CREATE TYPE public.problem_record_status AS ENUM ('open','investigating','mitigated','resolved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- problem_records table
CREATE TABLE public.problem_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  site_id UUID REFERENCES public.client_sites(id) ON DELETE SET NULL,
  issue_category TEXT,
  sub_category TEXT,
  title TEXT NOT NULL,
  root_cause TEXT,
  fix_plan TEXT,
  notes TEXT,
  owner_id UUID,
  status public.problem_record_status NOT NULL DEFAULT 'open',
  target_date DATE,
  resolved_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.problem_records TO authenticated;
GRANT ALL ON public.problem_records TO service_role;

ALTER TABLE public.problem_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view problem records" ON public.problem_records
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_technology_access(auth.uid())
    OR public.has_role(auth.uid(), 'network_engineer'::app_role)
    OR public.has_role(auth.uid(), 'network_manager'::app_role)
    OR public.has_role(auth.uid(), 'client_experience'::app_role)
    OR public.has_role(auth.uid(), 'support_agent'::app_role)
  );

CREATE POLICY "Staff can manage problem records" ON public.problem_records
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_technology_access(auth.uid())
    OR public.has_role(auth.uid(), 'network_engineer'::app_role)
    OR public.has_role(auth.uid(), 'network_manager'::app_role)
    OR public.has_role(auth.uid(), 'client_experience'::app_role)
  ) WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_technology_access(auth.uid())
    OR public.has_role(auth.uid(), 'network_engineer'::app_role)
    OR public.has_role(auth.uid(), 'network_manager'::app_role)
    OR public.has_role(auth.uid(), 'client_experience'::app_role)
  );

CREATE TRIGGER update_problem_records_updated_at
  BEFORE UPDATE ON public.problem_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Link table
CREATE TABLE public.problem_record_incidents (
  problem_record_id UUID NOT NULL REFERENCES public.problem_records(id) ON DELETE CASCADE,
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  linked_by UUID,
  PRIMARY KEY (problem_record_id, incident_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.problem_record_incidents TO authenticated;
GRANT ALL ON public.problem_record_incidents TO service_role;

ALTER TABLE public.problem_record_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view problem record incidents" ON public.problem_record_incidents
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_technology_access(auth.uid())
    OR public.has_role(auth.uid(), 'network_engineer'::app_role)
    OR public.has_role(auth.uid(), 'network_manager'::app_role)
    OR public.has_role(auth.uid(), 'client_experience'::app_role)
    OR public.has_role(auth.uid(), 'support_agent'::app_role)
  );

CREATE POLICY "Staff can manage problem record incidents" ON public.problem_record_incidents
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_technology_access(auth.uid())
    OR public.has_role(auth.uid(), 'network_engineer'::app_role)
    OR public.has_role(auth.uid(), 'network_manager'::app_role)
    OR public.has_role(auth.uid(), 'client_experience'::app_role)
  ) WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_technology_access(auth.uid())
    OR public.has_role(auth.uid(), 'network_engineer'::app_role)
    OR public.has_role(auth.uid(), 'network_manager'::app_role)
    OR public.has_role(auth.uid(), 'client_experience'::app_role)
  );

CREATE INDEX idx_problem_record_incidents_incident ON public.problem_record_incidents(incident_id);

-- Aggregation function
CREATE OR REPLACE FUNCTION public.recurring_issue_patterns(_window_days INT DEFAULT 90, _min_count INT DEFAULT 3)
RETURNS TABLE(
  client_id UUID,
  client_name TEXT,
  site_id UUID,
  site_name TEXT,
  issue_category TEXT,
  sub_category TEXT,
  incident_count BIGINT,
  first_seen TIMESTAMPTZ,
  last_seen TIMESTAMPTZ,
  avg_resolution_minutes NUMERIC,
  breach_count BIGINT,
  problem_record_id UUID,
  problem_record_status public.problem_record_status
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH grouped AS (
    SELECT
      i.client_id,
      i.site_id,
      COALESCE(NULLIF(i.issue_category,''),'(uncategorised)') AS issue_category,
      COALESCE(NULLIF(i.sub_category,''),'') AS sub_category,
      COUNT(*) AS incident_count,
      MIN(i.created_at) AS first_seen,
      MAX(i.created_at) AS last_seen,
      AVG(EXTRACT(EPOCH FROM (i.resolved_at - i.created_at))/60) FILTER (WHERE i.resolved_at IS NOT NULL) AS avg_resolution_minutes,
      COUNT(*) FILTER (WHERE i.due_at IS NOT NULL AND (i.resolved_at IS NULL OR i.resolved_at > i.due_at)) AS breach_count
    FROM public.incidents i
    WHERE i.created_at > now() - make_interval(days => _window_days)
    GROUP BY i.client_id, i.site_id, COALESCE(NULLIF(i.issue_category,''),'(uncategorised)'), COALESCE(NULLIF(i.sub_category,''),'')
    HAVING COUNT(*) >= _min_count
  )
  SELECT
    g.client_id,
    c.name AS client_name,
    g.site_id,
    cs.name AS site_name,
    g.issue_category,
    g.sub_category,
    g.incident_count,
    g.first_seen,
    g.last_seen,
    g.avg_resolution_minutes,
    g.breach_count,
    pr.id AS problem_record_id,
    pr.status AS problem_record_status
  FROM grouped g
  LEFT JOIN public.clients c ON c.id = g.client_id
  LEFT JOIN public.client_sites cs ON cs.id = g.site_id
  LEFT JOIN LATERAL (
    SELECT id, status FROM public.problem_records p
    WHERE p.client_id IS NOT DISTINCT FROM g.client_id
      AND COALESCE(p.issue_category,'') = COALESCE(g.issue_category,'')
      AND COALESCE(p.sub_category,'') = COALESCE(g.sub_category,'')
      AND p.site_id IS NOT DISTINCT FROM g.site_id
    ORDER BY created_at DESC LIMIT 1
  ) pr ON true
  ORDER BY g.incident_count DESC, g.last_seen DESC
$$;

-- Function to fetch incidents in a pattern (for drill-down)
CREATE OR REPLACE FUNCTION public.recurring_pattern_incidents(
  _client_id UUID,
  _site_id UUID,
  _issue_category TEXT,
  _sub_category TEXT,
  _window_days INT DEFAULT 90
)
RETURNS SETOF public.incidents
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.incidents i
  WHERE i.created_at > now() - make_interval(days => _window_days)
    AND i.client_id IS NOT DISTINCT FROM _client_id
    AND i.site_id IS NOT DISTINCT FROM _site_id
    AND COALESCE(NULLIF(i.issue_category,''),'(uncategorised)') = _issue_category
    AND COALESCE(NULLIF(i.sub_category,''),'') = COALESCE(_sub_category,'')
  ORDER BY i.created_at DESC
$$;

-- Notify trigger when a new incident causes group to cross threshold (>=3 in 90d) and not yet notified in last 7d
CREATE OR REPLACE FUNCTION public.notify_recurring_pattern()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_count INT;
  v_already INT;
  v_cat TEXT := COALESCE(NULLIF(NEW.issue_category,''),'(uncategorised)');
  v_sub TEXT := COALESCE(NULLIF(NEW.sub_category,''),'');
  v_client_name TEXT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.incidents
   WHERE created_at > now() - interval '90 days'
     AND client_id IS NOT DISTINCT FROM NEW.client_id
     AND site_id IS NOT DISTINCT FROM NEW.site_id
     AND COALESCE(NULLIF(issue_category,''),'(uncategorised)') = v_cat
     AND COALESCE(NULLIF(sub_category,''),'') = v_sub;

  IF v_count < 3 THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO v_already FROM public.notifications
   WHERE type = 'recurring_pattern'
     AND created_at > now() - interval '7 days'
     AND metadata->>'client_id' IS NOT DISTINCT FROM NEW.client_id::text
     AND metadata->>'issue_category' = v_cat
     AND COALESCE(metadata->>'sub_category','') = v_sub;

  IF v_already > 0 THEN RETURN NEW; END IF;

  SELECT name INTO v_client_name FROM public.clients WHERE id = NEW.client_id;

  PERFORM public.notify_role(
    'technology_manager',
    'recurring_pattern',
    'Recurring Issue Detected: ' || v_cat,
    COALESCE(v_client_name,'A client') || ' has ' || v_count || ' incidents of "' || v_cat ||
      CASE WHEN v_sub <> '' THEN ' / '||v_sub ELSE '' END || '" in the last 90 days.',
    '/crm/recurring-issues',
    jsonb_build_object('client_id', NEW.client_id, 'issue_category', v_cat, 'sub_category', v_sub, 'count', v_count)
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_recurring_pattern ON public.incidents;
CREATE TRIGGER trg_notify_recurring_pattern
  AFTER INSERT ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.notify_recurring_pattern();
