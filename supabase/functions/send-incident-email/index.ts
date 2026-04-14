const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/microsoft_outlook';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const OUTLOOK_API_KEY = Deno.env.get('MICROSOFT_OUTLOOK_API_KEY');
    if (!OUTLOOK_API_KEY) throw new Error('MICROSOFT_OUTLOOK_API_KEY is not configured');

    const { incident_number, title, description, priority, client_email, client_name, assigned_email, assigned_name } = await req.json();

    if (!title || !incident_number) {
      return new Response(JSON.stringify({ error: 'Missing required fields: title, incident_number' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: { client?: string; assigned?: string } = {};

    const buildHtml = (recipientName: string, isClient: boolean) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1a1a2e; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 20px;">Incident Notification</h1>
        </div>
        <div style="border: 1px solid #e0e0e0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <p>Dear ${recipientName},</p>
          <p>${isClient
            ? 'A new support ticket has been created for your account. Our team is working on it.'
            : 'A new incident has been assigned to you. Please review and take action.'
          }</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="background: #f5f5f5;">
              <td style="padding: 10px; font-weight: bold; border: 1px solid #e0e0e0;">Ticket ID</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0;">${incident_number}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; border: 1px solid #e0e0e0;">Title</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0;">${title}</td>
            </tr>
            <tr style="background: #f5f5f5;">
              <td style="padding: 10px; font-weight: bold; border: 1px solid #e0e0e0;">Priority</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0; text-transform: capitalize;">${priority || 'medium'}</td>
            </tr>
            ${description ? `
            <tr>
              <td style="padding: 10px; font-weight: bold; border: 1px solid #e0e0e0;">Description</td>
              <td style="padding: 10px; border: 1px solid #e0e0e0;">${description}</td>
            </tr>` : ''}
          </table>
          <p style="color: #666; font-size: 12px; margin-top: 24px;">This is an automated notification. Please do not reply directly to this email.</p>
        </div>
      </div>
    `;

    // Send to client
    if (client_email) {
      const resp = await fetch(`${GATEWAY_URL}/me/sendMail`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': OUTLOOK_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            subject: `[${incident_number}] Support Ticket Created: ${title}`,
            body: { contentType: 'HTML', content: buildHtml(client_name || 'Valued Customer', true) },
            toRecipients: [{ emailAddress: { address: client_email } }],
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
            body: { contentType: 'HTML', content: buildHtml(assigned_name || 'Team Member', false) },
            toRecipients: [{ emailAddress: { address: assigned_email } }],
          },
        }),
      });
      results.assigned = resp.ok ? 'sent' : `failed (${resp.status})`;
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
