// Per-user Microsoft Outlook OAuth for meeting hosts.
// Endpoints (all POST JSON):
//   { action: "start", redirect_uri }  → requires Authorization (user JWT) → returns { url }
//   { action: "complete", code, state, redirect_uri } → public → exchanges code, stores tokens
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SCOPES = "offline_access openid profile email User.Read Mail.Send";

const b64url = (buf: ArrayBuffer | Uint8Array): string => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const b64urlDecode = (s: string): Uint8Array => {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

const hmac = async (data: string, secret: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return b64url(sig);
};

const signState = async (userId: string, secret: string): Promise<string> => {
  const payload = { sub: userId, iat: Date.now(), nonce: crypto.randomUUID() };
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmac(body, secret);
  return `${body}.${sig}`;
};
const verifyState = async (state: string, secret: string): Promise<string> => {
  const [body, sig] = state.split(".");
  if (!body || !sig) throw new Error("Invalid state");
  const expect = await hmac(body, secret);
  if (expect !== sig) throw new Error("State signature mismatch");
  const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body)));
  if (!payload.sub) throw new Error("State missing user");
  if (Date.now() - payload.iat > 15 * 60 * 1000) throw new Error("State expired");
  return payload.sub as string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const TENANT = Deno.env.get("MS_OAUTH_TENANT_ID");
    const CLIENT_ID = Deno.env.get("MS_OAUTH_CLIENT_ID");
    const CLIENT_SECRET = Deno.env.get("MS_OAUTH_CLIENT_SECRET");
    const SR = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SU = Deno.env.get("SUPABASE_URL")!;
    if (!TENANT || !CLIENT_ID || !CLIENT_SECRET) {
      throw new Error("Microsoft OAuth credentials are not configured");
    }

    const body = await req.json();
    const { action, redirect_uri } = body ?? {};
    if (!redirect_uri || typeof redirect_uri !== "string") {
      return new Response(JSON.stringify({ error: "redirect_uri required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "start") {
      // Authenticated: identify user
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const anon = createClient(SU, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: cErr } = await anon.auth.getClaims(token);
      if (cErr || !claimsData?.claims?.sub) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const userId = claimsData.claims.sub as string;
      const state = await signState(userId, SR);
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: "code",
        redirect_uri,
        response_mode: "query",
        scope: SCOPES,
        state,
        prompt: "select_account",
      });
      const url = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/authorize?${params.toString()}`;
      return new Response(JSON.stringify({ url }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "complete") {
      const { code, state } = body;
      if (!code || !state) {
        return new Response(JSON.stringify({ error: "code and state required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const userId = await verifyState(state, SR);

      // Exchange code
      const tokenRes = await fetch(`https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
          redirect_uri,
          grant_type: "authorization_code",
          scope: SCOPES,
        }).toString(),
      });
      const tokenJson = await tokenRes.json();
      if (!tokenRes.ok) {
        throw new Error(`Token exchange failed: ${tokenJson.error_description || tokenJson.error || tokenRes.status}`);
      }
      const { access_token, refresh_token, expires_in, scope } = tokenJson;
      if (!refresh_token) throw new Error("No refresh_token returned (ensure offline_access scope is granted)");

      // Fetch user email
      let outlookEmail: string | null = null;
      try {
        const meRes = await fetch("https://graph.microsoft.com/v1.0/me", {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        if (meRes.ok) {
          const me = await meRes.json();
          outlookEmail = me.mail || me.userPrincipalName || null;
        }
      } catch (_) { /* ignore */ }

      const expiresAt = new Date(Date.now() + (expires_in - 60) * 1000).toISOString();
      const sb = createClient(SU, SR);
      const { error: upErr } = await sb.from("meeting_host_outlook_tokens").upsert({
        user_id: userId,
        outlook_email: outlookEmail,
        access_token,
        refresh_token,
        scope: scope ?? SCOPES,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      if (upErr) throw new Error(`Store token failed: ${upErr.message}`);

      return new Response(JSON.stringify({ success: true, outlook_email: outlookEmail }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("outlook-oauth error", err);
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});