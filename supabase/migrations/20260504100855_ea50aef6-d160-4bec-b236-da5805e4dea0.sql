-- Storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Attachments metadata table
CREATE TABLE public.attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('incident','incident_note','invoice','employee')),
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  mime_type TEXT,
  size_bytes BIGINT NOT NULL CHECK (size_bytes <= 1048576),
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attachments_entity ON public.attachments(entity_type, entity_id);

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Helper: can the current user access attachments for this entity?
CREATE OR REPLACE FUNCTION public.can_access_attachment(_entity_type TEXT, _entity_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;

  IF _entity_type IN ('incident','incident_note') THEN
    RETURN true; -- any authenticated user
  ELSIF _entity_type = 'invoice' THEN
    RETURN public.has_finance_access(uid);
  ELSIF _entity_type = 'employee' THEN
    IF public.has_hr_access(uid) THEN RETURN true; END IF;
    RETURN EXISTS (SELECT 1 FROM public.employees e WHERE e.id = _entity_id AND e.user_id = uid);
  END IF;
  RETURN false;
END;
$$;

-- RLS policies on attachments table
CREATE POLICY "View attachments by entity access"
ON public.attachments FOR SELECT TO authenticated
USING (public.can_access_attachment(entity_type, entity_id));

CREATE POLICY "Upload attachments by entity access"
ON public.attachments FOR INSERT TO authenticated
WITH CHECK (public.can_access_attachment(entity_type, entity_id) AND uploaded_by = auth.uid());

CREATE POLICY "Delete own attachments or admin"
ON public.attachments FOR DELETE TO authenticated
USING (uploaded_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for the 'attachments' bucket
-- Files are stored under: <entity_type>/<entity_id>/<uuid>-<filename>
CREATE POLICY "Read attachments via metadata access"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'attachments'
  AND EXISTS (
    SELECT 1 FROM public.attachments a
    WHERE a.file_path = storage.objects.name
      AND public.can_access_attachment(a.entity_type, a.entity_id)
  )
);

CREATE POLICY "Upload attachments to bucket"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'attachments' AND owner = auth.uid());

CREATE POLICY "Delete own bucket files or admin"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'attachments'
  AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
);