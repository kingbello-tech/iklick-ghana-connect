
CREATE TABLE public.sla_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  priority incident_priority NOT NULL UNIQUE,
  response_time_minutes INT NOT NULL,
  resolution_time_minutes INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sla_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view SLA policies"
  ON public.sla_policies FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage SLA policies"
  ON public.sla_policies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_sla_policies_updated_at
  BEFORE UPDATE ON public.sla_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Default SLA values
INSERT INTO public.sla_policies (priority, response_time_minutes, resolution_time_minutes) VALUES
  ('critical', 15, 120),
  ('high', 30, 240),
  ('medium', 60, 480),
  ('low', 120, 1440);
