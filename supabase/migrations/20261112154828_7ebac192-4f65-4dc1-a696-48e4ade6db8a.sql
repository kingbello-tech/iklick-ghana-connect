DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('site_onboarding','Auth view onboarding'),
    ('project_time_entries','Authenticated view project time'),
    ('client_churn','Auth view churn'),
    ('incident_history','Authenticated users can view history'),
    ('incident_closures','Authenticated view closures'),
    ('incident_tasks','Authenticated view incident tasks'),
    ('client_sites','Auth view sites'),
    ('incident_time_entries','Authenticated view time entries'),
    ('site_contracts','Auth view contracts'),
    ('project_comments','Authenticated view project comments'),
    ('project_milestones','Authenticated view milestones'),
    ('site_onboarding_tasks','Auth view onb tasks'),
    ('incident_approvals','Authenticated view approvals'),
    ('client_churn_log','Auth view churn log'),
    ('project_tasks','Authenticated view project tasks'),
    ('project_members','Authenticated view members')
  ) AS t(tbl, pol) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.pol, r.tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_staff(auth.uid()))', r.pol, r.tbl);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Authenticated view pay items" ON public.pay_items;
CREATE POLICY "Authenticated view pay items" ON public.pay_items FOR SELECT TO authenticated
  USING (public.has_hr_access(auth.uid()) OR public.has_finance_access(auth.uid()));
DROP POLICY IF EXISTS "Authenticated view paye bands" ON public.paye_bands;
CREATE POLICY "Authenticated view paye bands" ON public.paye_bands FOR SELECT TO authenticated
  USING (public.has_hr_access(auth.uid()) OR public.has_finance_access(auth.uid()));