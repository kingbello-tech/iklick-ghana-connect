
-- Service category enum
DO $$ BEGIN
  CREATE TYPE public.isp_service_category AS ENUM (
    'community_wifi', 'ftth', 'voip', 'dia'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Installation status enum
DO $$ BEGIN
  CREATE TYPE public.installation_status AS ENUM (
    'pending', 'in_progress', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Deals: commercial fields
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS mrc NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nrc NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contract_duration_months INTEGER DEFAULT 12,
  ADD COLUMN IF NOT EXISTS tcv NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS acv NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS isp_category public.isp_service_category;

CREATE OR REPLACE FUNCTION public.calculate_deal_values()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.tcv := COALESCE(NEW.mrc, 0) * COALESCE(NEW.contract_duration_months, 0) + COALESCE(NEW.nrc, 0);
  NEW.acv := COALESCE(NEW.mrc, 0) * 12;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS calculate_deal_values_trigger ON public.deals;
CREATE TRIGGER calculate_deal_values_trigger
  BEFORE INSERT OR UPDATE OF mrc, nrc, contract_duration_months ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.calculate_deal_values();

-- Helper functions
CREATE OR REPLACE FUNCTION public.has_technology_access(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin', 'technology_engineer', 'technology_manager')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_sales_manager_or_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin', 'sales_manager')
  )
$$;

-- Sales targets
CREATE TABLE IF NOT EXISTS public.sales_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category public.isp_service_category NOT NULL,
  target_month DATE NOT NULL,
  target_amount NUMERIC NOT NULL DEFAULT 0,
  carryover_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, category, target_month)
);

ALTER TABLE public.sales_targets ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_sales_targets_updated_at ON public.sales_targets;
CREATE TRIGGER update_sales_targets_updated_at
  BEFORE UPDATE ON public.sales_targets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Sales view own targets, managers view all"
  ON public.sales_targets FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_sales_manager_or_admin(auth.uid()));

CREATE POLICY "Sales managers create targets"
  ON public.sales_targets FOR INSERT TO authenticated
  WITH CHECK (public.is_sales_manager_or_admin(auth.uid()));

CREATE POLICY "Sales managers update targets"
  ON public.sales_targets FOR UPDATE TO authenticated
  USING (public.is_sales_manager_or_admin(auth.uid()))
  WITH CHECK (public.is_sales_manager_or_admin(auth.uid()));

CREATE POLICY "Sales managers delete targets"
  ON public.sales_targets FOR DELETE TO authenticated
  USING (public.is_sales_manager_or_admin(auth.uid()));

-- Installations
CREATE TABLE IF NOT EXISTS public.installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  assigned_to UUID,
  assigned_by UUID,
  status public.installation_status NOT NULL DEFAULT 'pending',
  scheduled_date DATE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.installations ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_installations_updated_at ON public.installations;
CREATE TRIGGER update_installations_updated_at
  BEFORE UPDATE ON public.installations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Tech and sales view installations"
  ON public.installations FOR SELECT TO authenticated
  USING (public.has_technology_access(auth.uid()) OR public.has_sales_access(auth.uid()));

CREATE POLICY "Tech managers create installations"
  ON public.installations FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'technology_manager'::app_role)
  );

CREATE POLICY "Tech team updates installations"
  ON public.installations FOR UPDATE TO authenticated
  USING (public.has_technology_access(auth.uid()))
  WITH CHECK (public.has_technology_access(auth.uid()));

CREATE POLICY "Admins delete installations"
  ON public.installations FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Auto-create installation when deal becomes Closed Won
CREATE OR REPLACE FUNCTION public.create_installation_on_won()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.stage = 'closed_won' AND (OLD.stage IS DISTINCT FROM 'closed_won') THEN
    INSERT INTO public.installations (deal_id, status)
    VALUES (NEW.id, 'pending');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_installation_on_won_trigger ON public.deals;
CREATE TRIGGER create_installation_on_won_trigger
  AFTER UPDATE OF stage ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.create_installation_on_won();

-- Site surveys workflow extension
ALTER TABLE public.site_surveys
  ADD COLUMN IF NOT EXISTS requested_by UUID,
  ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS engineer_notes TEXT,
  ADD COLUMN IF NOT EXISTS photos_url JSONB DEFAULT '[]'::jsonb;

CREATE POLICY "Tech team views surveys"
  ON public.site_surveys FOR SELECT TO authenticated
  USING (public.has_technology_access(auth.uid()));

CREATE POLICY "Tech team updates surveys"
  ON public.site_surveys FOR UPDATE TO authenticated
  USING (public.has_technology_access(auth.uid()))
  WITH CHECK (public.has_technology_access(auth.uid()));
