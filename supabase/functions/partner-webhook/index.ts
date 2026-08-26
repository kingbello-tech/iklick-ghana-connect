import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const OUR_STATUSES = ["open", "in_progress", "escalated", "resolved", "closed"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const url = new URL(req.url);
    const token = (url.searchParams.get("token") ?? req.headers.get("x-partner-token") ?? "").trim();
    if (!token || token.length < 16) return json({ error: "Unauthorized" }, 401);

    const { data: system } = await admin
      .from("partner_systems")
      .select("*")
      .eq("webhook_token", token)
      .eq("active", true)
      .maybeSingle();
    if (!system) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "Invalid JSON body" }, 400);

    const d: any = (body as any).data ?? (body as any).ticket ?? body;
    const externalId = d.id != null ? String(d.id) : d.ticket_id != null ? String(d.ticket_id) : null;
    const reference: string | null = d.external_reference ?? d.reference ?? (body as any).reference ?? null;
    const externalStatus: string | null = d.status ?? d.state ?? null;
    const comment: string | null = d.comment ?? d.note ?? (body as any).comment ?? null;
    const author: string | null = d.author ?? d.agent ?? (body as any).author ?? null;

    if (!externalId && !reference) return json({ error: "Missing ticket id or reference" }, 400);

    // Locate our linked incident
    let ticket: any = null;
    if (externalId) {
      const { data } = await admin
        .from("partner_tickets").select("*")
        .eq("partner_system_id", system.id).eq("external_ticket_id", externalId).maybeSingle();
      ticket = data;
    }
    if (!ticket && reference) {
      const { data: inc } = await admin
        .from("incidents").select("id").eq("incident_number", reference).maybeSingle();
      if (inc) {
        const { data } = await admin
          .from("partner_tickets").select("*")
          .eq("partner_system_id", system.id).eq("incident_id", inc.id).maybeSingle();
        ticket = data;
        if (!ticket) {
          const { data: created } = await admin.from("partner_tickets").insert({
            incident_id: inc.id, partner_system_id: system.id,
            external_ticket_id: externalId, sync_state: "synced",
          }).select().single();
          ticket = created;
        } else if (externalId && !ticket.external_ticket_id) {
          await admin.from("partner_tickets").update({ external_ticket_id: externalId }).eq("id", ticket.id);
        }
      }
    }

    if (!ticket) {
      await admin.from("partner_sync_log").insert({
        partner_system_id: system.id, direction: "inbound", action: "update",
        status: "ignored", message: "No matching incident", payload: body as any,
      });
      return json({ ok: false, matched: false, message: "No matching incident" }, 202);
    }

    const { data: incident } = await admin
      .from("incidents").select("id, status, created_by, incident_number").eq("id", ticket.incident_id).maybeSingle();

    const inboundMap = (system.inbound_status_map ?? {}) as Record<string, string>;
    let mappedStatus: string | null = null;
    if (externalStatus) {
      const candidate = inboundMap[externalStatus] ?? inboundMap[externalStatus.toLowerCase()] ?? null;
      if (candidate && OUR_STATUSES.includes(candidate)) mappedStatus = candidate;
    }

    await admin.from("partner_tickets").update({
      external_status: externalStatus ?? ticket.external_status,
      external_url: d.url ?? d.web_url ?? ticket.external_url,
      external_ticket_number: d.number ?? d.ticket_number ?? ticket.external_ticket_number,
      last_synced_at: new Date().toISOString(),
      sync_state: "synced",
      last_error: null,
    }).eq("id", ticket.id);

    if (incident && mappedStatus && mappedStatus !== incident.status) {
      const updates: Record<string, unknown> = { status: mappedStatus };
      if (mappedStatus === "resolved") updates.resolved_at = new Date().toISOString();
      if (mappedStatus === "closed") updates.closed_at = new Date().toISOString();
      await admin.from("incidents").update(updates).eq("id", incident.id);
      await admin.from("incident_history").insert({
        incident_id: incident.id,
        field_changed: "status",
        old_value: incident.status,
        new_value: mappedStatus,
      });
    }

    if (incident && comment) {
      await admin.from("incident_notes").insert({
        incident_id: incident.id,
        user_id: incident.created_by,
        content: `[${system.name}${author ? ` · ${author}` : ""}] ${String(comment).slice(0, 5000)}`,
        note_type: "internal",
      });
    }

    if (incident) {
      await admin.rpc("notify_role", {
        _role: "network_manager",
        _type: "partner_ticket_update",
        _title: `${system.name} update on ${incident.incident_number}`,
        _body: `${externalStatus ? `Status: ${externalStatus}. ` : ""}${comment ? String(comment).slice(0, 160) : ""}`.trim() || "Partner ticket updated.",
        _link: `/crm/incidents/${incident.id}`,
        _metadata: { incident_id: incident.id, partner_system_id: system.id },
      });
    }

    await admin.from("partner_sync_log").insert({
      partner_ticket_id: ticket.id,
      partner_system_id: system.id,
      incident_id: ticket.incident_id,
      direction: "inbound",
      action: comment ? "comment" : "update",
      status: "success",
      message: mappedStatus ? `Status → ${mappedStatus}` : externalStatus,
      payload: body as any,
    });

    return json({ ok: true, matched: true, incident_id: ticket.incident_id, status: mappedStatus });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
