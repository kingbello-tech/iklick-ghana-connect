import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const b = await req.json();
    if (clean(b?.website, 50)) return json({ ok: true }); // honeypot
    const name = clean(b?.name, 200), phone = clean(b?.phone, 40), email = clean(b?.email, 255);
    const company = clean(b?.company, 200), useCase = clean(b?.use_case, 100), message = clean(b?.message, 2000);
    const volume = Number(b?.monthly_volume) || 0;
    if (!name || !phone || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return json({ error: "Name, phone and a valid email are required" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: owners } = await admin.from("user_roles").select("user_id, role")
      .in("role", ["sales_manager", "admin"]);
    const owner = owners?.find((o) => o.role === "sales_manager") ?? owners?.[0];
    if (!owner) return json({ error: "Could not route inquiry" }, 500);

    const notes = [
      "Service: Bulk SMS / VAS",
      useCase && `Use case: ${useCase}`,
      volume && `Est. monthly volume: ${volume.toLocaleString()} SMS`,
      message && `Message: ${message}`,
    ].filter(Boolean).join(" | ");

    const { data: lead, error } = await admin.from("leads").insert({
      name, phone, email, company_name: company || null,
      lead_type: company ? "enterprise" : "sme", source: "website", status: "new",
      assigned_to: owner.user_id, created_by: owner.user_id, notes,
    }).select("id").single();
    if (error) { console.error(error); return json({ error: "Could not save inquiry" }, 500); }

    await admin.rpc("notify_user", {
      _user_id: owner.user_id, _type: "sms_inquiry", _title: `New SMS/VAS inquiry: ${company || name}`,
      _body: volume ? `~${volume.toLocaleString()} SMS/month` : "Website inquiry", _link: "/crm/sales/leads",
      _metadata: { lead_id: lead.id },
    });
    return json({ ok: true });
  } catch (e) { console.error(e); return json({ error: "Server error" }, 500); }
});
