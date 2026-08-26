
REVOKE EXECUTE ON FUNCTION public.partner_systems_for_incident(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.partner_systems_for_incident(uuid) TO service_role;
