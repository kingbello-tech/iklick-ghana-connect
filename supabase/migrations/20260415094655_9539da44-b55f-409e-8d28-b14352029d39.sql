
-- Enum types for sales module
CREATE TYPE public.lead_type AS ENUM ('home', 'sme', 'enterprise');
CREATE TYPE public.lead_source AS ENUM ('referral', 'website', 'walk_in', 'campaign');
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'unqualified');
CREATE TYPE public.deal_stage AS ENUM ('new_lead', 'qualification', 'site_survey', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost');
CREATE TYPE public.deal_service_type AS ENUM ('fiber_home', 'dedicated_business', 'enterprise_link');
CREATE TYPE public.installation_complexity AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.activity_type AS ENUM ('call', 'email', 'meeting', 'follow_up');
CREATE TYPE public.survey_status AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE public.survey_feasibility AS ENUM ('pending', 'yes', 'no');
CREATE TYPE public.quotation_status AS ENUM ('draft', 'sent', 'accepted', 'rejected');

-- Tables
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company_name text,
  phone text,
  email text,
  location text,
  lead_type public.lead_type NOT NULL DEFAULT 'home',
  source public.lead_source NOT NULL DEFAULT 'website',
  status public.lead_status NOT NULL DEFAULT 'new',
  assigned_to uuid,
  notes text,
  converted_deal_id uuid,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id),
  title text NOT NULL,
  value numeric(12,2) DEFAULT 0,
  expected_close_date date,
  probability integer DEFAULT 50,
  stage public.deal_stage NOT NULL DEFAULT 'new_lead',
  service_type public.deal_service_type,
  bandwidth text,
  installation_complexity public.installation_complexity DEFAULT 'low',
  assigned_to uuid,
  notes text,
  client_id uuid REFERENCES public.clients(id),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.deal_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  activity_type public.activity_type NOT NULL,
  description text,
  scheduled_at timestamptz,
  completed_at timestamptz,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.deal_activities ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.site_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  scheduled_date date,
  assigned_to uuid,
  feasibility public.survey_feasibility NOT NULL DEFAULT 'pending',
  infrastructure_notes text,
  cost_estimate numeric(12,2),
  status public.survey_status NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.site_surveys ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_site_surveys_updated_at BEFORE UPDATE ON public.site_surveys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  installation_cost numeric(12,2) DEFAULT 0,
  monthly_cost numeric(12,2) DEFAULT 0,
  status public.quotation_status NOT NULL DEFAULT 'draft',
  version integer NOT NULL DEFAULT 1,
  document_url text,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function
CREATE OR REPLACE FUNCTION public.has_sales_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin', 'sales_representative', 'sales_manager')
  )
$$;

-- RLS: leads
CREATE POLICY "Sales users can view leads" ON public.leads FOR SELECT TO authenticated USING (public.has_sales_access(auth.uid()));
CREATE POLICY "Sales users can create leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (public.has_sales_access(auth.uid()));
CREATE POLICY "Sales users can update leads" ON public.leads FOR UPDATE TO authenticated USING (public.has_sales_access(auth.uid())) WITH CHECK (public.has_sales_access(auth.uid()));
CREATE POLICY "Admins can delete leads" ON public.leads FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: deals
CREATE POLICY "Sales users can view deals" ON public.deals FOR SELECT TO authenticated USING (public.has_sales_access(auth.uid()));
CREATE POLICY "Sales users can create deals" ON public.deals FOR INSERT TO authenticated WITH CHECK (public.has_sales_access(auth.uid()));
CREATE POLICY "Sales users can update deals" ON public.deals FOR UPDATE TO authenticated USING (public.has_sales_access(auth.uid())) WITH CHECK (public.has_sales_access(auth.uid()));
CREATE POLICY "Admins can delete deals" ON public.deals FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: deal_activities
CREATE POLICY "Sales users can view activities" ON public.deal_activities FOR SELECT TO authenticated USING (public.has_sales_access(auth.uid()));
CREATE POLICY "Sales users can create activities" ON public.deal_activities FOR INSERT TO authenticated WITH CHECK (public.has_sales_access(auth.uid()));
CREATE POLICY "Sales users can update activities" ON public.deal_activities FOR UPDATE TO authenticated USING (public.has_sales_access(auth.uid())) WITH CHECK (public.has_sales_access(auth.uid()));
CREATE POLICY "Admins can delete activities" ON public.deal_activities FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: site_surveys
CREATE POLICY "Sales users can view surveys" ON public.site_surveys FOR SELECT TO authenticated USING (public.has_sales_access(auth.uid()));
CREATE POLICY "Sales users can create surveys" ON public.site_surveys FOR INSERT TO authenticated WITH CHECK (public.has_sales_access(auth.uid()));
CREATE POLICY "Sales users can update surveys" ON public.site_surveys FOR UPDATE TO authenticated USING (public.has_sales_access(auth.uid())) WITH CHECK (public.has_sales_access(auth.uid()));
CREATE POLICY "Admins can delete surveys" ON public.site_surveys FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: quotations
CREATE POLICY "Sales users can view quotations" ON public.quotations FOR SELECT TO authenticated USING (public.has_sales_access(auth.uid()));
CREATE POLICY "Sales users can create quotations" ON public.quotations FOR INSERT TO authenticated WITH CHECK (public.has_sales_access(auth.uid()));
CREATE POLICY "Sales users can update quotations" ON public.quotations FOR UPDATE TO authenticated USING (public.has_sales_access(auth.uid())) WITH CHECK (public.has_sales_access(auth.uid()));
CREATE POLICY "Admins can delete quotations" ON public.quotations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
