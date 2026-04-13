
CREATE TABLE public.client_satisfaction (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  incident_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  surveyed_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.client_satisfaction ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view satisfaction records"
ON public.client_satisfaction FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Staff and CX can create satisfaction records"
ON public.client_satisfaction FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'network_engineer'::app_role) OR
  has_role(auth.uid(), 'support_agent'::app_role) OR
  has_role(auth.uid(), 'client_experience'::app_role)
);

CREATE POLICY "Staff and CX can update satisfaction records"
ON public.client_satisfaction FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'client_experience'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'client_experience'::app_role)
);

CREATE POLICY "Admins can delete satisfaction records"
ON public.client_satisfaction FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_client_satisfaction_updated_at
BEFORE UPDATE ON public.client_satisfaction
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_client_satisfaction_client ON public.client_satisfaction(client_id);
CREATE INDEX idx_client_satisfaction_incident ON public.client_satisfaction(incident_id);
