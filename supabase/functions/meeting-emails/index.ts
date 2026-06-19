// Public edge function that sends Outlook emails for the meeting booking workflow.
// Types:
//   - host_pending:   guest booked a meeting → email host with Accept/Decline/Reschedule action links
//   - guest_response: host responded (accept/decline/reschedule) → email guest with the outcome
//   - host_confirmed: guest accepted or declined a proposed reschedule → email host with the final outcome

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GRAPH_URL = "https://graph.microsoft.com/v1.0";
const DEFAULT_APP_ORIGIN = "https://iklickgh.com";

const esc = (s: unknown): string => {
  if (s === null || s === undefined) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
};

const fmtDate = (iso: string, tz?: string) => {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      timeZone: tz || undefined,
      weekday: "short", year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

const wrap = (title: string, intro: string, inner: string, footer = "") => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; color: #1a1a1a;">
    <h2 style="color:#1a1a1a;margin:0 0 12px;">${title}</h2>
    <p style="margin:0 0 16px;">${intro}</p>
    <div style="background:#f5f7fa;padding:14px 16px;border-radius:8px;border-left:4px solid #2563eb;">
      ${inner}
    </div>
    ${footer ? `<div style="margin-top:20px;">${footer}</div>` : ""}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 12px;"/>
    <p style="font-size:12px;color:#888;margin:0;">iKlick Communications · Meetings</p>
  </div>
`;

const btn = (href: string, label: string, bg: string) =>
  `<a href="${href}" style="display:inline-block;background:${bg};color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600;margin:4px 6px 4px 0;">${esc(label)}</a>`;

const trimSecret = (value: string | undefined): string => (value ?? "").trim();

const getValidAccessToken = async (sb: any, hostUserId: string): Promise<string> => {
  const { data: tok, error } = await sb
    .from("meeting_host_outlook_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", hostUserId)
    .maybeSingle();
  if (error || !tok) throw new Error("Host has not connected their Outlook mailbox");
  if (new Date(tok.expires_at).getTime() > Date.now() + 30_000) return tok.access_token;

  // Refresh
  const TENANT = Deno.env.get("MS_OAUTH_TENANT_ID");
  const CLIENT_ID = Deno.env.get("MS_OAUTH_CLIENT_ID");
  const CLIENT_SECRET = trimSecret(Deno.env.get("MS_OAUTH_CLIENT_SECRET"));
  if (!TENANT || !CLIENT_ID || !CLIENT_SECRET) throw new Error("Microsoft OAuth credentials not configured");

  const res = await fetch(`https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: tok.refresh_token,
      scope: "offline_access openid profile email User.Read Mail.Send Calendars.ReadWrite",
    }).toString(),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`Outlook token refresh failed: ${j.error_description || j.error || res.status}`);

  const newExpires = new Date(Date.now() + (j.expires_in - 60) * 1000).toISOString();
  await sb.from("meeting_host_outlook_tokens").update({
    access_token: j.access_token,
    refresh_token: j.refresh_token ?? tok.refresh_token,
    expires_at: newExpires,
    updated_at: new Date().toISOString(),
  }).eq("user_id", hostUserId);

  return j.access_token as string;
};

const sendMail = async (sb: any, hostUserId: string, to: string, subject: string, html: string) => {
  const accessToken = await getValidAccessToken(sb, hostUserId);
  const res = await fetch(`${GRAPH_URL}/me/sendMail`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: "HTML", content: html },
        toRecipients: [{ emailAddress: { address: to } }],
      },
      saveToSentItems: true,
    }),
  });
  if (!res.ok && res.status !== 202) {
    const text = await res.text();
    throw new Error(`Outlook send failed [${res.status}]: ${text}`);
  }
  return true;
};

// Create a calendar event on the host's Outlook calendar.
// Adds the guest as attendee so they also receive a calendar invite + reminder.
const createCalendarEvent = async (
  sb: any,
  hostUserId: string,
  args: {
    subject: string;
    bodyHtml: string;
    startISO: string;
    endISO: string;
    timezone: string;
    guestName: string;
    guestEmail: string;
    hostName: string;
    hostEmail: string;
    teamsJoinUrl?: string | null;
  },
): Promise<{ id: string; webLink?: string } | null> => {
  try {
    const accessToken = await getValidAccessToken(sb, hostUserId);
    const location = args.teamsJoinUrl
      ? { displayName: "Microsoft Teams Meeting" }
      : { displayName: "Online" };
    const bodyContent = args.teamsJoinUrl
      ? `${args.bodyHtml}<p><a href="${args.teamsJoinUrl}">Join Microsoft Teams meeting</a></p>`
      : args.bodyHtml;
    const res = await fetch(`${GRAPH_URL}/me/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        subject: args.subject,
        body: { contentType: "HTML", content: bodyContent },
        start: { dateTime: args.startISO, timeZone: args.timezone || "UTC" },
        end: { dateTime: args.endISO, timeZone: args.timezone || "UTC" },
        location,
        isReminderOn: true,
        reminderMinutesBeforeStart: 15,
        attendees: [
          {
            emailAddress: { address: args.guestEmail, name: args.guestName },
            type: "required",
          },
        ],
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("createCalendarEvent failed", res.status, json);
      return null;
    }
    return { id: json.id, webLink: json.webLink };
  } catch (err) {
    console.error("createCalendarEvent error", err);
    return null;
  }
};

// Microsoft Graph wants datetimes without the timezone offset when timeZone is given.
const toGraphDateTime = (iso: string): string => {
  if (!iso) return iso;
  // Strip trailing Z or +/-HH:MM offset, keep milliseconds out
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.0000000`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { type, booking_id, app_origin } = body ?? {};
    if (!type || !booking_id) {
      return new Response(JSON.stringify({ error: "type and booking_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origin = (typeof app_origin === "string" && app_origin.startsWith("http")) ? app_origin.replace(/\/+$/, "") : DEFAULT_APP_ORIGIN;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: bk, error: bkErr } = await supabase
      .from("meeting_bookings")
      .select("id, host_id, start_at, end_at, proposed_start_at, proposed_end_at, guest_name, guest_email, notes, status, host_response, guest_decision, host_action_token, guest_action_token, host_message")
      .eq("id", booking_id)
      .maybeSingle();
    if (bkErr || !bk) throw new Error(`Booking not found: ${bkErr?.message || ""}`);

    const { data: host, error: hErr } = await supabase
      .from("meeting_hosts")
      .select("user_id, display_name, slug, timezone, teams_join_url, slot_minutes")
      .eq("id", bk.host_id)
      .maybeSingle();
    if (hErr || !host) throw new Error("Host not found");

    // Resolve host email via auth.users
    const { data: userRes, error: uErr } = await supabase.auth.admin.getUserById(host.user_id);
    if (uErr || !userRes?.user?.email) throw new Error("Host email not found");
    const hostEmail = userRes.user.email;

    if (type === "host_pending") {
      const respondUrl = `${origin}/booking/respond/${bk.host_action_token}`;
      const when = fmtDate(bk.start_at, host.timezone);
      const inner = `
        <strong>Guest:</strong> ${esc(bk.guest_name)} &lt;${esc(bk.guest_email)}&gt;<br/>
        <strong>When:</strong> ${esc(when)} (${esc(host.timezone)})<br/>
        <strong>Duration:</strong> ${esc(host.slot_minutes)} mins
        ${bk.notes ? `<br/><strong>Notes:</strong> ${esc(bk.notes)}` : ""}
      `;
      const footer = `
        <p style="margin:0 0 10px;font-weight:600;">Respond to this request:</p>
        ${btn(`${respondUrl}?action=accepted`, "Accept", "#16a34a")}
        ${btn(`${respondUrl}?action=declined`, "Decline", "#dc2626")}
        ${btn(`${respondUrl}?action=reschedule`, "Propose new time", "#2563eb")}
        <p style="font-size:12px;color:#666;margin:12px 0 0;">Or open the link to respond: <a href="${respondUrl}">${respondUrl}</a></p>
      `;
      const html = wrap(
        "New meeting request",
        `${esc(bk.guest_name)} requested to book time with you.`,
        inner,
        footer,
      );
      await sendMail(supabase, host.user_id, hostEmail, `Meeting request from ${bk.guest_name}`, html);
      return new Response(JSON.stringify({ success: true, sent_to: hostEmail }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "guest_response") {
      // Email guest about host's response
      const hostName = host.display_name;
      const teams = host.teams_join_url;
      let subject = "";
      let inner = "";
      let footer = "";
      let title = "";
      let intro = "";

      if (bk.host_response === "accepted") {
        title = "Your meeting is confirmed";
        subject = `Meeting confirmed with ${hostName}`;
        intro = `${esc(hostName)} accepted your meeting request.`;
        inner = `
          <strong>When:</strong> ${esc(fmtDate(bk.start_at, host.timezone))} (${esc(host.timezone)})<br/>
          <strong>Host:</strong> ${esc(hostName)}
          ${bk.host_message ? `<br/><strong>Message:</strong> ${esc(bk.host_message)}` : ""}
        `;
        footer = teams ? btn(teams, "Join Microsoft Teams meeting", "#2563eb") : "";
      } else if (bk.host_response === "declined") {
        title = "Your meeting request was declined";
        subject = `Meeting request declined by ${hostName}`;
        intro = `Unfortunately, ${esc(hostName)} is not able to meet at the requested time.`;
        inner = `
          <strong>Requested time:</strong> ${esc(fmtDate(bk.start_at, host.timezone))}
          ${bk.host_message ? `<br/><strong>Message:</strong> ${esc(bk.host_message)}` : ""}
        `;
        footer = `<a href="${origin}/meet/${esc(host.slug)}" style="color:#2563eb;">Book a different time</a>`;
      } else if (bk.host_response === "reschedule" && bk.proposed_start_at) {
        title = "New time proposed";
        subject = `${hostName} proposed a new time`;
        intro = `${esc(hostName)} can't meet at the originally requested time and proposed a new one. Please accept or decline.`;
        const confirmUrl = `${origin}/booking/confirm/${bk.guest_action_token}`;
        inner = `
          <strong>Originally requested:</strong> ${esc(fmtDate(bk.start_at, host.timezone))}<br/>
          <strong>Proposed new time:</strong> ${esc(fmtDate(bk.proposed_start_at, host.timezone))} (${esc(host.timezone)})
          ${bk.host_message ? `<br/><strong>Message:</strong> ${esc(bk.host_message)}` : ""}
        `;
        footer = `
          ${btn(`${confirmUrl}?decision=accept`, "Accept new time", "#16a34a")}
          ${btn(`${confirmUrl}?decision=decline`, "Decline", "#dc2626")}
          <p style="font-size:12px;color:#666;margin:12px 0 0;">Or open: <a href="${confirmUrl}">${confirmUrl}</a></p>
        `;
      } else {
        throw new Error("Unexpected host_response state");
      }

      const html = wrap(title, intro, inner, footer);
      await sendMail(supabase, host.user_id, bk.guest_email, subject, html);
      return new Response(JSON.stringify({ success: true, sent_to: bk.guest_email }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "host_confirmed") {
      // Notify host of guest's decision on proposed reschedule
      const accepted = bk.guest_decision === "accepted";
      const title = accepted ? "Reschedule accepted" : "Reschedule declined";
      const subject = accepted ? `${bk.guest_name} accepted the new time` : `${bk.guest_name} declined the new time`;
      const intro = accepted
        ? `${esc(bk.guest_name)} accepted your proposed new time. The meeting is confirmed.`
        : `${esc(bk.guest_name)} declined the proposed new time. The booking has been cancelled.`;
      const inner = `
        <strong>Guest:</strong> ${esc(bk.guest_name)} &lt;${esc(bk.guest_email)}&gt;<br/>
        <strong>Final time:</strong> ${esc(fmtDate(bk.start_at, host.timezone))} (${esc(host.timezone)})
      `;
      const footer = accepted && host.teams_join_url ? btn(host.teams_join_url, "Join Microsoft Teams meeting", "#2563eb") : "";
      const html = wrap(title, intro, inner, footer);
      await sendMail(supabase, host.user_id, hostEmail, subject, html);
      return new Response(JSON.stringify({ success: true, sent_to: hostEmail }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown type" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("meeting-emails error", err);
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});