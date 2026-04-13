
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can mark token as used" ON public.survey_tokens;
DROP POLICY IF EXISTS "Public survey submission" ON public.client_satisfaction;

-- Tighter anon update: only allow setting used=true on unused, non-expired tokens
CREATE POLICY "Anon can mark token as used"
  ON public.survey_tokens FOR UPDATE TO anon
  USING (used = false AND expires_at > now())
  WITH CHECK (used = true);

-- Tighter anon insert: surveyed_by must be set to a zero UUID placeholder for anonymous
CREATE POLICY "Anon can submit survey"
  ON public.client_satisfaction FOR INSERT TO anon
  WITH CHECK (surveyed_by = '00000000-0000-0000-0000-000000000000'::uuid);
