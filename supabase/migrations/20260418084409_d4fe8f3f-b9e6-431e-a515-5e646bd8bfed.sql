-- ============================================================
-- PHASE 1: Cross-Department Workflow Engine Foundations
-- ============================================================

-- 1. Lifecycle timestamp columns on deals
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS survey_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS installation_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS billing_active_at TIMESTAMPTZ;

-- 2. Audit log table (generic, polymorphic)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,            -- 'deal' | 'site_survey' | 'installation' | 'invoice'
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,                 -- 'created' | 'updated' | 'stage_changed' | 'completed' | etc
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  actor_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON public.audit_log(actor_id, created_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Helper: finance access
CREATE OR REPLACE FUNCTION public.has_finance_access(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin', 'finance_officer')
  )
$$;

CREATE POLICY "Managers and admins view audit log"
  ON public.audit_log FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'sales_manager'::app_role)
    OR public.has_role(auth.uid(), 'technology_manager'::app_role)
    OR public.has_role(auth.uid(), 'network_manager'::app_role)
    OR public.has_finance_access(auth.uid())
  );

-- System (triggers via SECURITY DEFINER functions) inserts; no direct insert/update/delete via API
CREATE POLICY "System inserts audit"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- 3. Notifications table (in-app bell)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,                   -- 'survey_completed' | 'deal_won' | 'install_completed' | 'invoice_ready' | 'assignment'
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,                            -- e.g. /crm/sales/pipeline?deal=xxx
  read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 4. Audit helper function
CREATE OR REPLACE FUNCTION public.log_audit(
  _entity_type TEXT,
  _entity_id UUID,
  _action TEXT,
  _field TEXT DEFAULT NULL,
  _old TEXT DEFAULT NULL,
  _new TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'::jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_log (entity_type, entity_id, action, field_changed, old_value, new_value, actor_id, metadata)
  VALUES (_entity_type, _entity_id, _action, _field, _old, _new, auth.uid(), _metadata);
END;
$$;

-- 5. Notification helper
CREATE OR REPLACE FUNCTION public.notify_user(
  _user_id UUID,
  _type TEXT,
  _title TEXT,
  _body TEXT DEFAULT NULL,
  _link TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'::jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
  VALUES (_user_id, _type, _title, _body, _link, _metadata);
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_role(
  _role TEXT,
  _type TEXT,
  _title TEXT,
  _body TEXT DEFAULT NULL,
  _link TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'::jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT user_id FROM public.user_roles WHERE role::text = _role LOOP
    INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
    VALUES (r.user_id, _type, _title, _body, _link, _metadata);
  END LOOP;
END;
$$;

-- 6. Trigger: site survey completion → update deal + notify sales rep + audit
CREATE OR REPLACE FUNCTION public.on_site_survey_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_deal RECORD;
BEGIN
  -- Status transition
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM public.log_audit('site_survey', NEW.id, 'status_changed', 'status', OLD.status::text, NEW.status::text);
  END IF;

  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN
    SELECT id, title, assigned_to, created_by INTO v_deal FROM public.deals WHERE id = NEW.deal_id;
    IF FOUND THEN
      UPDATE public.deals SET survey_completed_at = COALESCE(NEW.completed_at, now()) WHERE id = v_deal.id;
      PERFORM public.log_audit('deal', v_deal.id, 'survey_completed', NULL, NULL, NEW.feasibility::text,
        jsonb_build_object('survey_id', NEW.id, 'cost_estimate', NEW.cost_estimate));
      -- Notify the deal owner (sales rep)
      PERFORM public.notify_user(
        COALESCE(v_deal.assigned_to, v_deal.created_by),
        'survey_completed',
        'Site Survey Completed - ' || v_deal.title,
        'The site survey is complete. Feasibility: ' || NEW.feasibility::text || COALESCE('. Cost estimate: ₵' || NEW.cost_estimate::text, '') || '. Ready for negotiation.',
        '/crm/sales/pipeline',
        jsonb_build_object('deal_id', v_deal.id, 'survey_id', NEW.id)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_site_survey_workflow ON public.site_surveys;
CREATE TRIGGER trg_site_survey_workflow
  AFTER INSERT OR UPDATE ON public.site_surveys
  FOR EACH ROW EXECUTE FUNCTION public.on_site_survey_change();

-- 7. Trigger: installation completion → update deal + notify finance + audit
CREATE OR REPLACE FUNCTION public.on_installation_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_deal RECORD;
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM public.log_audit('installation', NEW.id, 'status_changed', 'status', OLD.status::text, NEW.status::text);
  END IF;

  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN
    SELECT id, title, assigned_to, created_by, mrc, nrc INTO v_deal FROM public.deals WHERE id = NEW.deal_id;
    IF FOUND THEN
      UPDATE public.deals SET installation_completed_at = COALESCE(NEW.completed_at, now()) WHERE id = v_deal.id;
      PERFORM public.log_audit('deal', v_deal.id, 'installation_completed', NULL, NULL, NULL,
        jsonb_build_object('installation_id', NEW.id));
      -- Notify all finance officers
      PERFORM public.notify_role(
        'finance_officer',
        'install_completed',
        'Installation Completed - ' || v_deal.title,
        'Installation is complete. Ready for invoicing. MRC: ₵' || COALESCE(v_deal.mrc::text, '0') || ', NRC: ₵' || COALESCE(v_deal.nrc::text, '0'),
        '/crm/finance/invoicing',
        jsonb_build_object('deal_id', v_deal.id, 'installation_id', NEW.id)
      );
      PERFORM public.notify_role(
        'admin',
        'install_completed',
        'Installation Completed - ' || v_deal.title,
        'Installation marked complete. Ready for invoicing.',
        '/crm/finance/invoicing',
        jsonb_build_object('deal_id', v_deal.id)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_installation_workflow ON public.installations;
CREATE TRIGGER trg_installation_workflow
  AFTER INSERT OR UPDATE ON public.installations
  FOR EACH ROW EXECUTE FUNCTION public.on_installation_change();

-- 8. Trigger: deal stage changes → audit + notify on closed_won
CREATE OR REPLACE FUNCTION public.on_deal_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.stage IS DISTINCT FROM NEW.stage) THEN
    PERFORM public.log_audit('deal', NEW.id, 'stage_changed', 'stage', OLD.stage::text, NEW.stage::text);

    IF NEW.stage = 'closed_won' THEN
      PERFORM public.notify_role(
        'technology_manager',
        'deal_won',
        'New Installation Request - ' || NEW.title,
        'Deal won! Please assign an engineer for installation. Service: ' || COALESCE(NEW.service_type::text, 'n/a'),
        '/crm/technology/installations',
        jsonb_build_object('deal_id', NEW.id)
      );
      PERFORM public.notify_role(
        'admin',
        'deal_won',
        'Deal Won - ' || NEW.title,
        'A new deal has been won and is ready for installation.',
        '/crm/technology/installations',
        jsonb_build_object('deal_id', NEW.id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deal_workflow ON public.deals;
CREATE TRIGGER trg_deal_workflow
  AFTER UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.on_deal_change();

-- 9. Backfill timestamps for existing completed records
UPDATE public.deals d
SET survey_completed_at = s.completed_at
FROM public.site_surveys s
WHERE s.deal_id = d.id AND s.status = 'completed' AND d.survey_completed_at IS NULL;

UPDATE public.deals d
SET installation_completed_at = i.completed_at
FROM public.installations i
WHERE i.deal_id = d.id AND i.status = 'completed' AND d.installation_completed_at IS NULL;
