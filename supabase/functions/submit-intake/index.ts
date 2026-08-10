import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      token,
      name,
      address,
      gps_address,
      phone,
      email,
      id_type,
      identification_file,
      bandwidth,
      service_type, // 'residential' | 'enterprise'
    } = body ?? {};

    if (!token || typeof token !== "string") {
      return new Response(JSON.stringify({ error: "Missing token" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!name || !phone) {
      return new Response(JSON.stringify({ error: "Name and phone are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (name.length > 200 || (email && email.length > 255)) {
      return new Response(JSON.stringify({ error: "Input too long" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (identification_file && (typeof identification_file.data !== "string" || identification_file.data.length > 1_500_000)) {
      return new Response(JSON.stringify({ error: "Attachment too large" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const lead_type = service_type === "enterprise" ? "enterprise" : "home";

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: link, error: linkErr } = await admin
      .from("intake_links")
      .select("id, sales_rep_id, active")
      .eq("token", token)
      .maybeSingle();

    if (linkErr || !link || !link.active) {
      return new Response(JSON.stringify({ error: "Invalid or inactive link" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const ID_LABELS: Record<string, string> = {
      ghana_card: "Ghana Card",
      drivers_license: "Driver's License",
      passport: "Passport",
    };
    const idLabel = ID_LABELS[String(id_type)] ?? null;

    const notesParts: string[] = [];
    if (gps_address) notesParts.push(`GPS: ${gps_address}`);
    if (idLabel && identification_file) notesParts.push(`ID document: ${idLabel}`);

    const { data: lead, error: leadErr } = await admin
      .from("leads")
      .insert({
        name: String(name).trim(),
        phone: String(phone).trim(),
        email: email ? String(email).trim() : null,
        location: address ? String(address).trim() : null,
        address: address ? String(address).trim() : null,
        gps_address: gps_address ? String(gps_address).trim() : null,
        ghana_card_number: null,
        bandwidth: bandwidth ? String(bandwidth).trim() : null,
        lead_type,
        source: "website",
        status: "new",
        assigned_to: link.sales_rep_id,
        created_by: link.sales_rep_id,
        notes: notesParts.join(" | ") || null,
      })
      .select("id")
      .single();

    if (leadErr) {
      console.error("Lead insert failed", leadErr);
      return new Response(JSON.stringify({ error: "Could not save submission" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Store the identification document as a lead attachment
    if (identification_file?.data) {
      try {
        const bytes = Uint8Array.from(atob(identification_file.data), (c) => c.charCodeAt(0));
        if (bytes.byteLength <= 1024 * 1024) {
          const safeName = String(identification_file.name || "identification")
            .replace(/[^a-zA-Z0-9._-]/g, "_")
            .slice(0, 120);
          const path = `lead/${lead.id}/${crypto.randomUUID()}-${safeName}`;
          const contentType = String(identification_file.type || "application/octet-stream");
          const { error: upErr } = await admin.storage.from("attachments").upload(path, bytes, { contentType, upsert: false });
          if (upErr) {
            console.error("ID upload failed", upErr);
          } else {
            const { error: attErr } = await admin.from("attachments").insert({
              entity_type: "lead",
              entity_id: lead.id,
              file_name: `${idLabel ?? "Identification"} - ${safeName}`,
              file_path: path,
              mime_type: contentType,
              size_bytes: bytes.byteLength,
              uploaded_by: link.sales_rep_id,
            });
            if (attErr) console.error("Attachment insert failed", attErr);
          }
        }
      } catch (e) {
        console.error("ID attachment error", e);
      }
    }

    // Notify the sales rep
    await admin.rpc("notify_user", {
      _user_id: link.sales_rep_id,
      _type: "intake_submission",
      _title: `New intake: ${name}`,
      _body: `${lead_type === "enterprise" ? "Enterprise" : "Residential"} prospect submitted via your link.`,
      _link: "/crm/sales/leads",
      _metadata: { lead_id: lead.id },
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});