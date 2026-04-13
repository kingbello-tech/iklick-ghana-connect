
-- Create survey_tokens table for public survey links
CREATE TABLE public.survey_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.survey_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view survey tokens"
  ON public.survey_tokens FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Staff can create survey tokens"
  ON public.survey_tokens FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'support_agent'::app_role) OR
    has_role(auth.uid(), 'network_engineer'::app_role) OR
    has_role(auth.uid(), 'client_experience'::app_role)
  );

CREATE POLICY "Admins can delete survey tokens"
  ON public.survey_tokens FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow anonymous users to read a token by its value (for public survey page)
CREATE POLICY "Anyone can read token by value"
  ON public.survey_tokens FOR SELECT TO anon
  USING (true);

-- Allow anonymous users to mark token as used
CREATE POLICY "Anyone can mark token as used"
  ON public.survey_tokens FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- Allow anonymous inserts to client_satisfaction (for public survey submission)
CREATE POLICY "Public survey submission"
  ON public.client_satisfaction FOR INSERT TO anon
  WITH CHECK (true);

-- Allow anon to read clients for survey page
CREATE POLICY "Anon can read clients for survey"
  ON public.clients FOR SELECT TO anon
  USING (true);

CREATE INDEX idx_survey_tokens_token ON public.survey_tokens (token);
CREATE INDEX idx_survey_tokens_client_id ON public.survey_tokens (client_id);
