import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const expected = Deno.env.get("CRON_SECRET");
  const provided = req.headers.get("x-cron-secret");
  if (!expected || provided !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    // 1) Auto-escalate stale open tickets via existing RPC
    const { data: escalated } = await supabase.rpc("auto_escalate_stale_incidents");

    // 2) Find incidents past due_at that are not resolved/closed and notify managers
    const now = new Date().toISOString();
    const { data: breached } = await supabase
      .from("incidents")
      .select("id, incident_number, title, priority, status, due_at, assigned_to")
      .lt("due_at", now)
      .not("status", "in", "(resolved,closed)")
      .limit(200);

    let breachCount = 0;
    for (const inc of breached || []) {
      // skip if we already logged a breach notification recently for this incident
      const { data: recent } = await supabase
        .from("incident_history")
        .select("id")
        .eq("incident_id", inc.id)
        .eq("field_changed", "sla_breached")
        .limit(1);
      if (recent && recent.length > 0) continue;

      await supabase.from("incident_history").insert({
        incident_id: inc.id,
        field_changed: "sla_breached",
        old_value: null,
        new_value: inc.due_at,
      });

      // notify managers
      await supabase.rpc("notify_role", {
        _role: "network_manager",
        _type: "sla_breached",
        _title: `SLA breached: ${inc.incident_number}`,
        _body: `${inc.title} (priority: ${inc.priority}) is past its SLA deadline.`,
        _link: `/crm/incidents/${inc.id}`,
        _metadata: { incident_id: inc.id },
      });
      breachCount++;
    }

    // 3) Technology field work SLA: overdue site surveys
    const { data: overdueSurveys } = await supabase
      .from("site_surveys")
      .select("id, due_at, assigned_to, status, deals(title)")
      .lt("due_at", now)
      .eq("sla_breach_notified", false)
      .not("status", "in", "(completed,cancelled)")
      .limit(200);

    let surveyBreaches = 0;
    for (const s of overdueSurveys || []) {
      const dealTitle = (s as any).deals?.title ?? "Site survey";
      await supabase.rpc("notify_role", {
        _role: "technology_manager",
        _type: "tech_sla_breached",
        _title: `Survey SLA breached: ${dealTitle}`,
        _body: `Site survey for "${dealTitle}" is past its SLA deadline.`,
        _link: `/crm/technology/surveys`,
        _metadata: { survey_id: s.id },
      });
      await supabase.from("site_surveys").update({ sla_breach_notified: true }).eq("id", s.id);
      surveyBreaches++;
    }

    // 4) Technology field work SLA: overdue installations
    const { data: overdueInstalls } = await supabase
      .from("installations")
      .select("id, work_order_number, due_at, assigned_to, status, deals(title)")
      .lt("due_at", now)
      .eq("sla_breach_notified", false)
      .not("status", "in", "(completed,cancelled)")
      .limit(200);

    let installBreaches = 0;
    for (const inst of overdueInstalls || []) {
      const dealTitle = (inst as any).deals?.title ?? "Installation";
      const label = inst.work_order_number ? `${inst.work_order_number} · ${dealTitle}` : dealTitle;
      await supabase.rpc("notify_role", {
        _role: "technology_manager",
        _type: "tech_sla_breached",
        _title: `Installation SLA breached: ${label}`,
        _body: `Installation for "${dealTitle}" is past its SLA deadline.`,
        _link: `/crm/technology/installations`,
        _metadata: { installation_id: inst.id },
      });
      await supabase.from("installations").update({ sla_breach_notified: true }).eq("id", inst.id);
      installBreaches++;
    }


    return new Response(
      JSON.stringify({ ok: true, escalated, breached: breachCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});