
-- Enums
CREATE TYPE public.site_status AS ENUM ('onboarding','active','suspended','churned');
CREATE TYPE public.contract_status AS ENUM ('pending','active','expired','cancelled');
CREATE TYPE public.onboarding_stage AS ENUM ('survey','install','test','live');
CREATE TYPE public.churn_risk AS ENUM ('low','medium','high','churned');

-- client_sites
CREATE TABLE public.client_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  name text NOT NULL,
  location text,
  gps_address text,
  service_type public.service_type,
  bandwidth text,
  status public.site_status NOT NULL DEFAULT 'onboarding',
  go_live_date date,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_client_sites_client ON public.client_sites(client_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_sites TO authenticated;
GRANT ALL ON public.client_sites TO service_role;
ALTER TABLE public.client_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view sites" ON public.client_sites FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff create sites" ON public.client_sites FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'network_manager'::app_role) OR has_role(auth.uid(),'network_engineer'::app_role) OR has_role(auth.uid(),'technology_manager'::app_role) OR has_role(auth.uid(),'technology_engineer'::app_role) OR has_sales_access(auth.uid()));
CREATE POLICY "Staff update sites" ON public.client_sites FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'network_manager'::app_role) OR has_role(auth.uid(),'network_engineer'::app_role) OR has_role(auth.uid(),'technology_manager'::app_role) OR has_role(auth.uid(),'technology_engineer'::app_role) OR has_role(auth.uid(),'client_experience'::app_role));
CREATE POLICY "Admin delete sites" ON public.client_sites FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_client_sites_updated BEFORE UPDATE ON public.client_sites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- site_contracts
CREATE TABLE public.site_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.client_sites(id) ON DELETE CASCADE,
  mrc numeric(12,2) NOT NULL DEFAULT 0,
  nrc numeric(12,2) NOT NULL DEFAULT 0,
  contract_start date,
  contract_end date,
  renewal_date date,
  contract_duration_months integer DEFAULT 12,
  billing_reference text,
  status public.contract_status NOT NULL DEFAULT 'pending',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_site_contracts_site ON public.site_contracts(site_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_contracts TO authenticated;
GRANT ALL ON public.site_contracts TO service_role;
ALTER TABLE public.site_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view contracts" ON public.site_contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage contracts" ON public.site_contracts FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'network_manager'::app_role) OR has_role(auth.uid(),'technology_manager'::app_role) OR has_finance_access(auth.uid()) OR has_sales_access(auth.uid()));
CREATE POLICY "Staff update contracts" ON public.site_contracts FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'network_manager'::app_role) OR has_role(auth.uid(),'technology_manager'::app_role) OR has_finance_access(auth.uid()));
CREATE POLICY "Admin delete contracts" ON public.site_contracts FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_site_contracts_updated BEFORE UPDATE ON public.site_contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- site_onboarding (one row per site)
CREATE TABLE public.site_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL UNIQUE REFERENCES public.client_sites(id) ON DELETE CASCADE,
  current_stage public.onboarding_stage NOT NULL DEFAULT 'survey',
  survey_owner uuid,
  install_owner uuid,
  test_owner uuid,
  survey_completed_at timestamptz,
  install_completed_at timestamptz,
  test_completed_at timestamptz,
  live_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_onboarding TO authenticated;
GRANT ALL ON public.site_onboarding TO service_role;
ALTER TABLE public.site_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view onboarding" ON public.site_onboarding FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage onboarding" ON public.site_onboarding FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'network_manager'::app_role) OR has_role(auth.uid(),'network_engineer'::app_role) OR has_role(auth.uid(),'technology_manager'::app_role) OR has_role(auth.uid(),'technology_engineer'::app_role));
CREATE POLICY "Staff update onboarding" ON public.site_onboarding FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'network_manager'::app_role) OR has_role(auth.uid(),'network_engineer'::app_role) OR has_role(auth.uid(),'technology_manager'::app_role) OR has_role(auth.uid(),'technology_engineer'::app_role));
CREATE POLICY "Admin delete onboarding" ON public.site_onboarding FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_site_onboarding_updated BEFORE UPDATE ON public.site_onboarding FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- site_onboarding_tasks
CREATE TABLE public.site_onboarding_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.client_sites(id) ON DELETE CASCADE,
  stage public.onboarding_stage NOT NULL,
  title text NOT NULL,
  description text,
  assigned_to uuid,
  due_date date,
  status text NOT NULL DEFAULT 'open',
  completed_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_onb_tasks_site ON public.site_onboarding_tasks(site_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_onboarding_tasks TO authenticated;
GRANT ALL ON public.site_onboarding_tasks TO service_role;
ALTER TABLE public.site_onboarding_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view onb tasks" ON public.site_onboarding_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff create onb tasks" ON public.site_onboarding_tasks FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'network_manager'::app_role) OR has_role(auth.uid(),'network_engineer'::app_role) OR has_role(auth.uid(),'technology_manager'::app_role) OR has_role(auth.uid(),'technology_engineer'::app_role)));
CREATE POLICY "Staff update onb tasks" ON public.site_onboarding_tasks FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'network_manager'::app_role) OR has_role(auth.uid(),'technology_manager'::app_role) OR assigned_to = auth.uid() OR created_by = auth.uid());
CREATE POLICY "Owner delete onb tasks" ON public.site_onboarding_tasks FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR created_by = auth.uid());

CREATE TRIGGER trg_onb_tasks_updated BEFORE UPDATE ON public.site_onboarding_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- client_churn (one row per client)
CREATE TABLE public.client_churn (
  client_id uuid PRIMARY KEY,
  risk_level public.churn_risk NOT NULL DEFAULT 'low',
  manual_override boolean NOT NULL DEFAULT false,
  score integer NOT NULL DEFAULT 0,
  reason text,
  churned_at timestamptz,
  last_assessed_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_churn TO authenticated;
GRANT ALL ON public.client_churn TO service_role;
ALTER TABLE public.client_churn ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view churn" ON public.client_churn FOR SELECT TO authenticated USING (true);
CREATE POLICY "Mgmt manage churn" ON public.client_churn FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'network_manager'::app_role) OR has_role(auth.uid(),'technology_manager'::app_role) OR has_role(auth.uid(),'client_experience'::app_role));
CREATE POLICY "Mgmt update churn" ON public.client_churn FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'network_manager'::app_role) OR has_role(auth.uid(),'technology_manager'::app_role) OR has_role(auth.uid(),'client_experience'::app_role));
CREATE POLICY "Admin delete churn" ON public.client_churn FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_client_churn_updated BEFORE UPDATE ON public.client_churn FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- client_churn_log
CREATE TABLE public.client_churn_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  action text NOT NULL,
  from_status text,
  to_status text,
  notes text,
  performed_by uuid,
  performed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_churn_log_client ON public.client_churn_log(client_id);

GRANT SELECT, INSERT, DELETE ON public.client_churn_log TO authenticated;
GRANT ALL ON public.client_churn_log TO service_role;
ALTER TABLE public.client_churn_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view churn log" ON public.client_churn_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Mgmt insert churn log" ON public.client_churn_log FOR INSERT TO authenticated
  WITH CHECK (performed_by = auth.uid() AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'network_manager'::app_role) OR has_role(auth.uid(),'technology_manager'::app_role) OR has_role(auth.uid(),'client_experience'::app_role)));
CREATE POLICY "Admin delete churn log" ON public.client_churn_log FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));

-- incidents.site_id
ALTER TABLE public.incidents ADD COLUMN site_id uuid REFERENCES public.client_sites(id) ON DELETE SET NULL;
CREATE INDEX idx_incidents_site ON public.incidents(site_id);

-- Auto-create site_onboarding when a site is created
CREATE OR REPLACE FUNCTION public.create_site_onboarding()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.site_onboarding (site_id) VALUES (NEW.id)
  ON CONFLICT (site_id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_site_auto_onboarding AFTER INSERT ON public.client_sites
FOR EACH ROW EXECUTE FUNCTION public.create_site_onboarding();

-- Churn risk computation
CREATE OR REPLACE FUNCTION public.compute_client_churn_score(_client_id uuid)
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_recent_incidents int := 0;
  v_breached int := 0;
  v_csat numeric := NULL;
  v_overdue int := 0;
  v_days_since_activity int := 999;
  v_score int := 0;
BEGIN
  SELECT COUNT(*) INTO v_recent_incidents FROM public.incidents
   WHERE client_id = _client_id AND created_at > now() - interval '30 days';
  SELECT COUNT(*) INTO v_breached FROM public.incidents
   WHERE client_id = _client_id AND due_at IS NOT NULL AND resolved_at IS NULL AND due_at < now();
  SELECT AVG(rating) INTO v_csat FROM public.client_satisfaction
   WHERE client_id = _client_id AND created_at > now() - interval '180 days';
  SELECT COUNT(*) INTO v_overdue FROM public.invoices
   WHERE client_id = _client_id AND status::text IN ('overdue') AND balance_due > 0;
  SELECT EXTRACT(DAY FROM (now() - MAX(created_at)))::int INTO v_days_since_activity
   FROM public.incidents WHERE client_id = _client_id;

  v_score := LEAST(100,
      (v_recent_incidents * 5)
    + (v_breached * 10)
    + (CASE WHEN v_csat IS NOT NULL AND v_csat < 3 THEN 25 ELSE 0 END)
    + (CASE WHEN v_csat IS NOT NULL AND v_csat < 2 THEN 15 ELSE 0 END)
    + (v_overdue * 10)
    + (CASE WHEN v_days_since_activity > 180 THEN 10 ELSE 0 END)
  );
  RETURN v_score;
END;
$$;
