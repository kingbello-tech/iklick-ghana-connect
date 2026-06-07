import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/microsoft_outlook';

const escapeHtml = (s: unknown): string => {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Require authenticated caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(
      authHeader.replace('Bearer ', '')
    );
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const OUTLOOK_API_KEY = Deno.env.get('MICROSOFT_OUTLOOK_API_KEY');
    if (!OUTLOOK_API_KEY) throw new Error('MICROSOFT_OUTLOOK_API_KEY is not configured');

    const { incident_number, title, description, priority, client_email, client_name, assigned_email, assigned_name, is_note_update, is_closed, ticket_url, tech_team_emails, flag_reason } = await req.json();

    if (!title || !incident_number) {
      return new Response(JSON.stringify({ error: 'Missing required fields: title, incident_number' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Escape all user-controlled fields used in HTML
    const e_incident_number = escapeHtml(incident_number);
    const e_title = escapeHtml(title);
    const e_description = escapeHtml(description);
    const e_priority = escapeHtml(priority || 'medium');
    const e_flag_reason = escapeHtml(flag_reason || '');
    const safe_ticket_url = typeof ticket_url === 'string' && /^https?:\/\//i.test(ticket_url) ? ticket_url : '';

    const results: { client?: string; assigned?: string; tech_team?: string } = {};

    const buildHtml = (recipientName: string, isClient: boolean, isUpdate: boolean = false, isClosed: boolean = false) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1a1a2e; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 20px;">${isClosed ? 'Ticket Closed' : isUpdate ? 'Ticket Update' : 'Incident Notification'}</h1>
        </div>
        <div style="border: 1px solid #e0e0e0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <p>Dear ${escapeHtml(recipientName)},</p>
          <p>${isClosed
            ? 'Your support ticket has been closed. Thank you for choosing iKlick. If you experience the issue again, please reach out and we will be happy to assist.'
            : isUpdate
            ? 'There has been a new update on your support ticket.'
            : isClient
              ? 'A new support ticket has been created for your account. Our team is working on it.'
              : 'A new incident has been assigned to you. Please review and take action.'
          }</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="background: #f5f5f5;">
              <td style="padding: 10px; font-weight: bold; border: 1px solid #e0e0e0;">Ticket ID</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0;">${e_incident_number}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; border: 1px solid #e0e0e0;">Title</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0;">${e_title}</td>
            </tr>
            <tr style="background: #f5f5f5;">
              <td style="padding: 10px; font-weight: bold; border: 1px solid #e0e0e0;">Priority</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0; text-transform: capitalize;">${e_priority}</td>
            </tr>
            ${description ? `
            <tr>
              <td style="padding: 10px; font-weight: bold; border: 1px solid #e0e0e0;">${isUpdate ? 'Update' : isClosed ? 'Resolution' : 'Description'}</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0;">${e_description}</td>
            </tr>` : ''}
          </table>
          ${safe_ticket_url && !isClient ? `<p style="margin: 20px 0;"><a href="${escapeHtml(safe_ticket_url)}" style="display: inline-block; background: #1a1a2e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Open Ticket</a></p>` : ''}
          <p style="color: #666; font-size: 12px; margin-top: 24px;">This is an automated notification. Please do not reply directly to this email.</p>
        </div>
      </div>
    `;

    // Send to client
    if (client_email) {
      const emailSubject = is_closed
        ? `[${incident_number}] Your Support Ticket Has Been Closed: ${title}`
        : is_note_update
          ? `[${incident_number}] Update on Your Support Ticket: ${title}`
          : `[${incident_number}] Support Ticket Created: ${title}`;
      const resp = await fetch(`${GATEWAY_URL}/me/sendMail`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': OUTLOOK_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            subject: emailSubject,
            body: { contentType: 'HTML', content: buildHtml(client_name || 'Valued Customer', true, !!is_note_update, !!is_closed) },
            toRecipients: [{ emailAddress: { address: client_email } }],
            from: { emailAddress: { address: 'noc@iklickgh.com', name: 'Iklick Support' } },
          },
        }),
      });
      results.client = resp.ok ? 'sent' : `failed (${resp.status})`;
    }

    // Send to assigned staff
    if (assigned_email) {
      const resp = await fetch(`${GATEWAY_URL}/me/sendMail`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': OUTLOOK_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            subject: `[${incident_number}] New Incident Assigned: ${title}`,
            body: { contentType: 'HTML', content: buildHtml(assigned_name || 'Team Member', false, false, false) },
            toRecipients: [{ emailAddress: { address: assigned_email } }],
            from: { emailAddress: { address: 'noc@iklickgh.com', name: 'Iklick Support' } },
          },
        }),
      });
      results.assigned = resp.ok ? 'sent' : `failed (${resp.status})`;
    }

    // Send to Technology team (broadcast for flagged/critical incidents)
    if (Array.isArray(tech_team_emails) && tech_team_emails.length > 0) {
      const recipients = (tech_team_emails as string[])
        .filter((e) => typeof e === 'string' && e.includes('@'))
        .map((address) => ({ emailAddress: { address } }));
      if (recipients.length > 0) {
        const subject = `[${incident_number}] ${flag_reason || 'Flagged Incident'}: ${title}`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #b91c1c; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 20px;">⚠ Flagged Incident</h1>
            </div>
            <div style="border: 1px solid #e0e0e0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
              <p>Hello Technology Team,</p>
              <p>${e_flag_reason || 'An incident has been flagged and requires attention.'}</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr style="background: #f5f5f5;"><td style="padding:10px;font-weight:bold;border:1px solid #e0e0e0;">Ticket ID</td><td style="padding:10px;border:1px solid #e0e0e0;">${e_incident_number}</td></tr>
                <tr><td style="padding:10px;font-weight:bold;border:1px solid #e0e0e0;">Title</td><td style="padding:10px;border:1px solid #e0e0e0;">${e_title}</td></tr>
                <tr style="background:#f5f5f5;"><td style="padding:10px;font-weight:bold;border:1px solid #e0e0e0;">Priority</td><td style="padding:10px;border:1px solid #e0e0e0;text-transform:capitalize;">${e_priority}</td></tr>
                ${description ? `<tr><td style="padding:10px;font-weight:bold;border:1px solid #e0e0e0;">Description</td><td style="padding:10px;border:1px solid #e0e0e0;">${e_description}</td></tr>` : ''}
              </table>
              ${safe_ticket_url ? `<p style="margin: 20px 0;"><a href="${escapeHtml(safe_ticket_url)}" style="display: inline-block; background: #b91c1c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Open Ticket</a></p>` : ''}
              <p style="color: #666; font-size: 12px; margin-top: 24px;">This is an automated notification.</p>
            </div>
          </div>`;
        const resp = await fetch(`${GATEWAY_URL}/me/sendMail`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'X-Connection-Api-Key': OUTLOOK_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              subject,
              body: { contentType: 'HTML', content: html },
              toRecipients: recipients,
              from: { emailAddress: { address: 'noc@iklickgh.com', name: 'Iklick NOC' } },
            },
          }),
        });
        results.tech_team = resp.ok ? `sent (${recipients.length})` : `failed (${resp.status})`;
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error sending incident email:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
