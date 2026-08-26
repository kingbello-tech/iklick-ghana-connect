import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type Action = "create" | "update" | "comment" | "close" | "auto";

const DEFAULT_FIELD_MAP: Record<string, string> = {
  title: "subject",
  description: "description",
  priority: "priority",
  status: "status",
  reference: "external_reference",
  account_ref: "account_reference",
  client_name: "customer_name",
  comment: "body",
};

function mapPayload(base: Record<string, unknown>, fieldMap: Record<string, string>) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(base)) {
    if (value === undefined || value === null || value === "") continue;
    const target = fieldMap[key] ?? DEFAULT_FIELD_MAP[key] ?? key;
    out[target] = value;
  }
  return out;
}

function buildUrl(baseUrl: string, path: string, externalId?: string | null) {
  const p = (path || "").replace("{external_id}", externalId ?? "");
  return `${baseUrl.replace(/\/+$/, "")}/${p.replace(/^\/+/, "")}`;
}

function pickId(body: any): { id?: string; number?: string; url?: string; status?: string } {
  if (!body || typeof body !== "object") return {};
  const d = body.data ?? body.ticket ?? body.result ?? body;
  return {
    id: d.id != null ? String(d.id) : d.ticket_id != null ? String(d.ticket_id) : undefined,
    number: d.number ?? d.ticket_number ?? d.reference ?? undefined,
    url: d.url ?? d.web_url ?? d.html_url ?? undefined,
    status: d.status ?? d.state ?? undefined,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
    if (!token) return json({ error: "Unauthorized" }, 401);
    const { data: userData, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const { data: isStaff } = await admin.rpc("is_staff", { _user_id: userId });
    const { data: isClient } = await admin.rpc("is_client_user", { _user_id: userId });
    if (!isStaff || isClient) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const incidentId: string | undefined = body.incident_id;
    const action: Action = body.action ?? "auto";
    if (!incidentId) return json({ error: "incident_id is required" }, 400);

    const { data: incident, error: incErr } = await admin
      .from("incidents")
      .select("id, incident_number, title, description, priority, status, issue_category, location, client_id")
      .eq("id", incidentId)
      .maybeSingle();
    if (incErr || !incident) return json({ error: "Incident not found" }, 404);

    let clientName: string | null = null;
    if (incident.client_id) {
      const { data: c } = await admin.from("clients").select("name").eq("id", incident.client_id).maybeSingle();
      clientName = c?.name ?? null;
    }

    // Resolve target partner systems
    let targets: { partner_system_id: string; partner_account_ref: string | null }[] = [];
    if (body.partner_system_id) {
      const { data: link } = await admin
        .from("partner_client_accounts")
        .select("partner_account_ref")
        .eq("partner_system_id", body.partner_system_id)
        .eq("client_id", incident.client_id ?? "00000000-0000-0000-0000-000000000000")
        .maybeSingle();
      targets = [{ partner_system_id: body.partner_system_id, partner_account_ref: link?.partner_account_ref ?? null }];
    } else {
      const { data: auto } = await admin.rpc("partner_systems_for_incident", { _incident_id: incidentId });
      targets = (auto as any[]) ?? [];
    }

    if (targets.length === 0) return json({ ok: true, skipped: true, reason: "No partner system configured" });

    const results: unknown[] = [];

    for (const target of targets) {
      const { data: system } = await admin
        .from("partner_systems")
        .select("*")
        .eq("id", target.partner_system_id)
        .maybeSingle();
      if (!system || !system.active) {
        results.push({ partner_system_id: target.partner_system_id, ok: false, error: "System inactive or missing" });
        continue;
      }

      const apiKey = (Deno.env.get(system.api_key_secret_name) ?? "").trim();
      if (!apiKey) {
        await admin.from("partner_sync_log").insert({
          partner_system_id: system.id, incident_id: incidentId, direction: "outbound",
          action, status: "error", message: `Missing secret ${system.api_key_secret_name}`,
        });
        results.push({ partner_system_id: system.id, ok: false, error: `Missing API key secret ${system.api_key_secret_name}` });
        continue;
      }

      // Existing link
      const { data: existing } = await admin
        .from("partner_tickets")
        .select("*")
        .eq("incident_id", incidentId)
        .eq("partner_system_id", system.id)
        .maybeSingle();

      let effective: Action = action;
      if (action === "auto") effective = existing?.external_ticket_id ? "update" : "create";
      if (effective !== "create" && !existing?.external_ticket_id) effective = "create";

      const fieldMap = (system.field_map ?? {}) as Record<string, string>;
      const statusMap = (system.status_map ?? {}) as Record<string, string>;
      const priorityMap = (system.priority_map ?? {}) as Record<string, string>;

      let url: string;
      let method: string;
      let payload: Record<string, unknown>;

      if (effective === "comment") {
        url = buildUrl(system.base_url, system.comment_path, existing?.external_ticket_id);
        method = "POST";
        payload = mapPayload({ comment: body.note ?? "", reference: incident.incident_number }, fieldMap);
      } else if (effective === "close") {
        url = buildUrl(system.base_url, system.close_path || system.update_path, existing?.external_ticket_id);
        method = system.close_path ? "POST" : system.update_method;
        payload = mapPayload(
          { status: statusMap["closed"] ?? "closed", comment: body.note ?? undefined, reference: incident.incident_number },
          fieldMap,
        );
      } else {
        const isCreate = effective === "create";
        url = buildUrl(system.base_url, isCreate ? system.create_path : system.update_path, existing?.external_ticket_id);
        method = isCreate ? "POST" : system.update_method;
        payload = mapPayload({
          title: incident.title,
          description: incident.description ?? "",
          priority: priorityMap[incident.priority] ?? incident.priority,
          status: statusMap[incident.status] ?? incident.status,
          reference: incident.incident_number,
          account_ref: target.partner_account_ref ?? undefined,
          client_name: clientName ?? undefined,
          category: incident.issue_category ?? undefined,
          location: incident.location ?? undefined,
        }, fieldMap);
      }

      let httpStatus = 0;
      let respBody: any = null;
      let errorMessage: string | null = null;

      try {
        const res = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            [system.auth_header_name]: `${system.auth_header_prefix ?? ""}${apiKey}`,
          },
          body: JSON.stringify(payload),
        });
        httpStatus = res.status;
        const text = await res.text();
        try { respBody = text ? JSON.parse(text) : null; } catch { respBody = { raw: text.slice(0, 2000) }; }
        if (!res.ok) errorMessage = `HTTP ${res.status}: ${text.slice(0, 500)}`;
      } catch (e) {
        errorMessage = (e as Error).message;
      }

      const parsed = pickId(respBody);
      const nowIso = new Date().toISOString();

      const row = {
        incident_id: incidentId,
        partner_system_id: system.id,
        external_ticket_id: parsed.id ?? existing?.external_ticket_id ?? null,
        external_ticket_number: parsed.number ?? existing?.external_ticket_number ?? null,
        external_url: parsed.url ?? existing?.external_url ?? null,
        external_status: parsed.status ?? existing?.external_status ?? null,
        sync_state: errorMessage ? "error" : "synced",
        last_error: errorMessage,
        last_pushed_at: nowIso,
        created_by: existing?.created_by ?? userId,
      };

      if (existing) {
        await admin.from("partner_tickets").update(row).eq("id", existing.id);
      } else {
        await admin.from("partner_tickets").insert(row);
      }

      const { data: ticketRow } = await admin
        .from("partner_tickets").select("id")
        .eq("incident_id", incidentId).eq("partner_system_id", system.id).maybeSingle();

      await admin.from("partner_sync_log").insert({
        partner_ticket_id: ticketRow?.id ?? null,
        partner_system_id: system.id,
        incident_id: incidentId,
        direction: "outbound",
        action: effective,
        status: errorMessage ? "error" : "success",
        http_status: httpStatus || null,
        message: errorMessage,
        payload: { request: payload, response: respBody },
      });

      results.push({
        partner_system_id: system.id,
        partner_name: system.name,
        action: effective,
        ok: !errorMessage,
        error: errorMessage,
        external_ticket_id: row.external_ticket_id,
      });
    }

    return json({ ok: results.every((r: any) => r.ok), results });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
