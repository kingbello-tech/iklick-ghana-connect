
-- ============== ROLE ==============
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hr_officer';

-- HR access helper
CREATE OR REPLACE FUNCTION public.has_hr_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin', 'hr_officer', 'finance_officer')
  )
$$;

-- ============== ENUMS ==============
CREATE TYPE public.employment_type AS ENUM ('permanent', 'contract', 'probation', 'intern');
CREATE TYPE public.employment_status AS ENUM ('active', 'on_leave', 'terminated');
CREATE TYPE public.pay_item_type AS ENUM ('allowance', 'deduction', 'employer_cost');
CREATE TYPE public.pay_item_calc AS ENUM ('fixed', 'percent_of_basic');
CREATE TYPE public.payroll_run_status AS ENUM ('draft', 'approved', 'paid');

-- ============== EMPLOYEES ==============
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  ssnit_number TEXT,
  tin TEXT,
  ghana_card_number TEXT,
  bank_name TEXT,
  bank_branch TEXT,
  bank_account TEXT,
  momo_number TEXT,
  momo_network TEXT,
  hire_date DATE,
  termination_date DATE,
  employment_type public.employment_type NOT NULL DEFAULT 'permanent',
  status public.employment_status NOT NULL DEFAULT 'active',
  job_title TEXT,
  department TEXT,
  basic_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
  tier2_trustee TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_employees_user ON public.employees(user_id);
CREATE INDEX idx_employees_status ON public.employees(status);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR can view all employees"
  ON public.employees FOR SELECT TO authenticated
  USING (public.has_hr_access(auth.uid()));

CREATE POLICY "Staff view own employee record"
  ON public.employees FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "HR insert employees"
  ON public.employees FOR INSERT TO authenticated
  WITH CHECK (public.has_hr_access(auth.uid()));

CREATE POLICY "HR update employees"
  ON public.employees FOR UPDATE TO authenticated
  USING (public.has_hr_access(auth.uid()))
  WITH CHECK (public.has_hr_access(auth.uid()));

CREATE POLICY "Admins delete employees"
  ON public.employees FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== PAY ITEMS CATALOG ==============
CREATE TABLE public.pay_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  item_type public.pay_item_type NOT NULL DEFAULT 'allowance',
  taxable BOOLEAN NOT NULL DEFAULT true,
  pension_qualifying BOOLEAN NOT NULL DEFAULT false,
  calc_method public.pay_item_calc NOT NULL DEFAULT 'fixed',
  default_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pay_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view pay items"
  ON public.pay_items FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "HR manage pay items"
  ON public.pay_items FOR ALL TO authenticated
  USING (public.has_hr_access(auth.uid()))
  WITH CHECK (public.has_hr_access(auth.uid()));

CREATE TRIGGER trg_pay_items_updated_at
  BEFORE UPDATE ON public.pay_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.pay_items (name, item_type, taxable, pension_qualifying, calc_method, default_value, description) VALUES
  ('Transport Allowance', 'allowance', true, false, 'fixed', 0, 'Monthly transport allowance'),
  ('Rent Allowance', 'allowance', true, false, 'fixed', 0, 'Monthly rent allowance'),
  ('Risk Allowance', 'allowance', true, true, 'percent_of_basic', 10, 'Risk allowance (% of basic)'),
  ('Responsibility Allowance', 'allowance', true, true, 'fixed', 0, 'Responsibility allowance'),
  ('Overtime', 'allowance', true, false, 'fixed', 0, 'Overtime payment'),
  ('Bonus', 'allowance', true, false, 'fixed', 0, 'Discretionary bonus'),
  ('Salary Advance Recovery', 'deduction', false, false, 'fixed', 0, 'Recovery of salary advance'),
  ('Loan Repayment', 'deduction', false, false, 'fixed', 0, 'Staff loan repayment'),
  ('Tier 3 Voluntary', 'deduction', false, false, 'percent_of_basic', 0, 'Voluntary Tier 3 pension contribution'),
  ('Welfare Dues', 'deduction', false, false, 'fixed', 0, 'Staff welfare contribution');

-- ============== EMPLOYEE PAY ITEMS (recurring) ==============
CREATE TABLE public.employee_pay_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  pay_item_id UUID NOT NULL REFERENCES public.pay_items(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, pay_item_id)
);

CREATE INDEX idx_employee_pay_items_employee ON public.employee_pay_items(employee_id);

ALTER TABLE public.employee_pay_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR view employee pay items"
  ON public.employee_pay_items FOR SELECT TO authenticated
  USING (public.has_hr_access(auth.uid()));

CREATE POLICY "Staff view own pay items"
  ON public.employee_pay_items FOR SELECT TO authenticated
  USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

CREATE POLICY "HR manage employee pay items"
  ON public.employee_pay_items FOR ALL TO authenticated
  USING (public.has_hr_access(auth.uid()))
  WITH CHECK (public.has_hr_access(auth.uid()));

CREATE TRIGGER trg_employee_pay_items_updated_at
  BEFORE UPDATE ON public.employee_pay_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== PAYE BANDS ==============
CREATE TABLE public.paye_bands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  effective_from DATE NOT NULL,
  band_order INT NOT NULL,
  lower_bound NUMERIC(12,2) NOT NULL,    -- inclusive lower bound of taxable income
  upper_bound NUMERIC(12,2),              -- exclusive upper bound; NULL = infinity
  rate_percent NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(effective_from, band_order)
);

ALTER TABLE public.paye_bands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view paye bands"
  ON public.paye_bands FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins manage paye bands"
  ON public.paye_bands FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed current GRA monthly resident PAYE bands (effective 2024-01-01)
INSERT INTO public.paye_bands (effective_from, band_order, lower_bound, upper_bound, rate_percent) VALUES
  ('2024-01-01', 1, 0,        490,      0),
  ('2024-01-01', 2, 490,      600,      5),
  ('2024-01-01', 3, 600,      730,      10),
  ('2024-01-01', 4, 730,      3896.67,  17.5),
  ('2024-01-01', 5, 3896.67,  19896.67, 25),
  ('2024-01-01', 6, 19896.67, 50416.67, 30),
  ('2024-01-01', 7, 50416.67, NULL,     35);

-- ============== STATUTORY RATES ==============
CREATE TABLE public.statutory_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  effective_from DATE NOT NULL UNIQUE,
  ssnit_employee_pct NUMERIC(5,2) NOT NULL DEFAULT 5.5,
  ssnit_employer_pct NUMERIC(5,2) NOT NULL DEFAULT 13.0,
  tier2_pct NUMERIC(5,2) NOT NULL DEFAULT 5.0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.statutory_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view statutory rates"
  ON public.statutory_rates FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins manage statutory rates"
  ON public.statutory_rates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_statutory_rates_updated_at
  BEFORE UPDATE ON public.statutory_rates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.statutory_rates (effective_from, ssnit_employee_pct, ssnit_employer_pct, tier2_pct, notes) VALUES
  ('2024-01-01', 5.5, 13.0, 5.0, 'SSNIT 18.5% total split: employee 5.5%, employer 13%; Tier 2 employer 5%.');
