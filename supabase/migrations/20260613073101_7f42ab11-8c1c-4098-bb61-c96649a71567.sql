CREATE OR REPLACE FUNCTION public.is_project_mgmt_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = 'service_delivery'
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND lower(trim(department)) IN ('service delivery', 'project management', 'service_delivery')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_technology_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('technology_manager','technology_engineer','network_manager','network_engineer')
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND lower(trim(department)) = 'technology'
  )
$$;