
-- Incident notes
CREATE TABLE public.incident_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  content TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'note' CHECK (note_type IN ('note', 'log', 'image')),
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.incident_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view notes"
  ON public.incident_notes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can create notes"
  ON public.incident_notes FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'network_engineer') OR
    public.has_role(auth.uid(), 'support_agent')
  );

CREATE POLICY "Admins can delete notes"
  ON public.incident_notes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Incident history
CREATE TABLE public.incident_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.incident_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view history"
  ON public.incident_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can create history"
  ON public.incident_history FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'network_engineer') OR
    public.has_role(auth.uid(), 'support_agent')
  );
