
DROP VIEW IF EXISTS public.meeting_host_outlook_status;
DROP POLICY IF EXISTS "Users can view own outlook connection" ON public.meeting_host_outlook_tokens;

-- Status function that returns only safe fields, never tokens
CREATE OR REPLACE FUNCTION public.get_my_outlook_connection()
RETURNS TABLE(outlook_email text, expires_at timestamptz, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT outlook_email, expires_at, updated_at
  FROM public.meeting_host_outlook_tokens
  WHERE user_id = auth.uid()
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_outlook_connection() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_outlook_connection() TO authenticated;
