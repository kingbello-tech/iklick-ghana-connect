
CREATE TABLE public.partner_systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  base_url text NOT NULL,
  auth_header_name text NOT NULL DEFAULT 'Authorization',
  auth_header_prefix text NOT NULL DEFAULT 'Bearer ',
  api_key_secret_name text NOT NULL DEFAULT 'PARTNER_ISP_API_KEY',
  create_path text NOT NULL DEFAULT '/tickets',
  update_path text NOT NULL DEFAULT '/tickets/{external_id}',
  comment_path text NOT NULL DEFAULT '/tickets/{external_id}/comments',
  close_path text,
  update_method text NOT NULL DEFAULT 'PATCH',
  field_map jsonb NOT NULL DEFAULT '{}'::jsonb,
  status_map jsonb NOT NULL DEFAULT '{}'::jsonb,
  inbound_status_map jsonb NOT NULL DEFAULT '{}'::jsonb,
  priority_map jsonb NOT NULL DEFAULT '{}'::jsonb,
  webhook_token text NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  auto_escalate boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX partner_systems_webhook_token_idx ON public.partner_systems(webhook_token);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_systems TO authenticated;
GRANT ALL ON public.partner_systems TO service_role;
ALTER TABLE public.partner_systems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view partner systems" ON public.partner_systems
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) AND NOT public.is_client_user(auth.uid()));
CREATE POLICY "Admins manage partner systems" ON public.partner_systems
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'network_manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'network_manager'));

CREATE TABLE public.partner_client_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_system_id uuid NOT NULL REFERENCES public.partner_systems(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  partner_account_ref text,
  auto_escalate boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_system_id, client_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_client_accounts TO authenticated;
GRANT ALL ON public.partner_client_accounts TO service_role;
ALTER TABLE public.partner_client_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view partner client accounts" ON public.partner_client_accounts
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) AND NOT public.is_client_user(auth.uid()));
CREATE POLICY "Admins manage partner client accounts" ON public.partner_client_accounts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'network_manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'network_manager'));

CREATE TABLE public.partner_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  partner_system_id uuid NOT NULL REFERENCES public.partner_systems(id) ON DELETE CASCADE,
  external_ticket_id text,
  external_ticket_number text,
  external_url text,
  external_status text,
  sync_state text NOT NULL DEFAULT 'pending',
  last_error text,
  last_pushed_at timestamptz,
  last_synced_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (incident_id, partner_system_id)
);
CREATE INDEX partner_tickets_external_idx ON public.partner_tickets(partner_system_id, external_ticket_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_tickets TO authenticated;
GRANT ALL ON public.partner_tickets TO service_role;
ALTER TABLE public.partner_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view partner tickets" ON public.partner_tickets
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) AND NOT public.is_client_user(auth.uid()));
CREATE POLICY "Staff can create partner tickets" ON public.partner_tickets
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()) AND NOT public.is_client_user(auth.uid()));
CREATE POLICY "Staff can update partner tickets" ON public.partner_tickets
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()) AND NOT public.is_client_user(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()) AND NOT public.is_client_user(auth.uid()));
CREATE POLICY "Admins delete partner tickets" ON public.partner_tickets
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'network_manager'));

CREATE TABLE public.partner_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_ticket_id uuid REFERENCES public.partner_tickets(id) ON DELETE CASCADE,
  partner_system_id uuid REFERENCES public.partner_systems(id) ON DELETE CASCADE,
  incident_id uuid REFERENCES public.incidents(id) ON DELETE CASCADE,
  direction text NOT NULL,
  action text NOT NULL,
  status text NOT NULL,
  http_status integer,
  message text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX partner_sync_log_incident_idx ON public.partner_sync_log(incident_id, created_at DESC);

GRANT SELECT ON public.partner_sync_log TO authenticated;
GRANT ALL ON public.partner_sync_log TO service_role;
ALTER TABLE public.partner_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view partner sync log" ON public.partner_sync_log
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) AND NOT public.is_client_user(auth.uid()));

CREATE TRIGGER update_partner_systems_updated_at BEFORE UPDATE ON public.partner_systems
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_partner_client_accounts_updated_at BEFORE UPDATE ON public.partner_client_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_partner_tickets_updated_at BEFORE UPDATE ON public.partner_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: which partner systems should auto-escalate an incident
CREATE OR REPLACE FUNCTION public.partner_systems_for_incident(_incident_id uuid)
RETURNS TABLE(partner_system_id uuid, partner_account_ref text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ps.id, pca.partner_account_ref
  FROM public.incidents i
  JOIN public.partner_client_accounts pca ON pca.client_id = i.client_id
  JOIN public.partner_systems ps ON ps.id = pca.partner_system_id
  WHERE i.id = _incident_id
    AND ps.active AND ps.auto_escalate AND pca.auto_escalate
$$;
