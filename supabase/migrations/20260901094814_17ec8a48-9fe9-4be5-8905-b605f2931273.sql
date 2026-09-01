CREATE TABLE public.tech_sla_policies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_type text NOT NULL UNIQUE,
  target_hours integer NOT NULL DEFAULT 72,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tech_sla_policies_task_type_check CHECK (task_type IN ('site_survey','installation')),
  CONSTRAINT tech_sla_policies_target_hours_check CHECK (target_hours > 0)
);

GRANT SELECT ON public.tech_sla_policies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_sla_policies TO authenticated;
GRANT ALL ON public.tech_sla_policies TO service_role;

ALTER TABLE public.tech_sla_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view tech sla policies" ON public.tech_sla_policies
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins and tech managers manage tech sla policies" ON public.tech_sla_policies
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technology_manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'technology_manager'));

INSERT INTO public.tech_sla_policies (task_type, target_hours) VALUES
  ('site_survey', 72),
  ('installation', 120);

ALTER TABLE public.site_surveys ADD COLUMN IF NOT EXISTS due_at timestamptz;
ALTER TABLE public.site_surveys ADD COLUMN IF NOT EXISTS sla_breach_notified boolean NOT NULL DEFAULT false;
ALTER TABLE public.installations ADD COLUMN IF NOT EXISTS due_at timestamptz;
ALTER TABLE public.installations ADD COLUMN IF NOT EXISTS sla_breach_notified boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.set_tech_work_due_at() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _type text := TG_ARGV[0];
  _hours integer;
BEGIN
  SELECT target_hours INTO _hours FROM public.tech_sla_policies WHERE task_type = _type AND active;
  IF _hours IS NULL THEN _hours := 72; END IF;
  IF NEW.due_at IS NULL THEN
    NEW.due_at := COALESCE(NEW.created_at, now()) + make_interval(hours => _hours);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_survey_due_at ON public.site_surveys;
CREATE TRIGGER set_survey_due_at BEFORE INSERT ON public.site_surveys
  FOR EACH ROW EXECUTE FUNCTION public.set_tech_work_due_at('site_survey');

DROP TRIGGER IF EXISTS set_install_due_at ON public.installations;
CREATE TRIGGER set_install_due_at BEFORE INSERT ON public.installations
  FOR EACH ROW EXECUTE FUNCTION public.set_tech_work_due_at('installation');

UPDATE public.site_surveys s
SET due_at = s.created_at + make_interval(hours => COALESCE((SELECT target_hours FROM public.tech_sla_policies WHERE task_type = 'site_survey'), 72))
WHERE s.due_at IS NULL;

UPDATE public.installations i
SET due_at = i.created_at + make_interval(hours => COALESCE((SELECT target_hours FROM public.tech_sla_policies WHERE task_type = 'installation'), 120))
WHERE i.due_at IS NULL;