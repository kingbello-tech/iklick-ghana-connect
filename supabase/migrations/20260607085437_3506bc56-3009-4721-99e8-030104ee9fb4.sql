
-- 1) Drop overly permissive audit_log INSERT policy; log_audit() runs as SECURITY DEFINER and bypasses RLS, so direct inserts are not needed.
DROP POLICY IF EXISTS "System inserts audit" ON public.audit_log;

-- 2) Fix function search_path
ALTER FUNCTION public.invoice_approval_threshold() SET search_path = public;

-- 3) Revoke EXECUTE on internal SECURITY DEFINER functions from anon/authenticated/PUBLIC.
REVOKE EXECUTE ON FUNCTION public.auto_escalate_stale_incidents() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_client_churn_score(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.dunning_sweep() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_monthly_recurring_invoices() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_audit(text, uuid, text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_role(text, text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_user(uuid, text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;

-- Trigger-only functions: revoke from PUBLIC/anon/authenticated (they are still callable as triggers internally).
REVOKE EXECUTE ON FUNCTION public.create_installation_on_won() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_invoice_on_install_complete() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_project_on_won() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_site_onboarding() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_site_survey_on_stage_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.flag_invoice_approval() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_invoice_send() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_deal_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_installation_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_invoice_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_site_survey_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_incident_due_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_invoice_on_payment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_deal_stage_transition() FROM PUBLIC, anon, authenticated;
