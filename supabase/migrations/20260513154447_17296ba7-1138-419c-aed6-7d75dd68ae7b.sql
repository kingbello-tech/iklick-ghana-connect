
-- Work order ID for installations
CREATE SEQUENCE IF NOT EXISTS public.work_order_number_seq START 1;

ALTER TABLE public.installations
  ADD COLUMN IF NOT EXISTS work_order_number text;

CREATE OR REPLACE FUNCTION public.generate_work_order_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.work_order_number IS NULL OR NEW.work_order_number = '' THEN
    NEW.work_order_number := 'WO-' || LPAD(nextval('public.work_order_number_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_work_order_number ON public.installations;
CREATE TRIGGER set_work_order_number
  BEFORE INSERT ON public.installations
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_work_order_number();

-- Backfill existing rows
UPDATE public.installations
SET work_order_number = 'WO-' || LPAD(nextval('public.work_order_number_seq')::text, 5, '0')
WHERE work_order_number IS NULL;

ALTER TABLE public.installations
  ADD CONSTRAINT installations_work_order_number_key UNIQUE (work_order_number);
