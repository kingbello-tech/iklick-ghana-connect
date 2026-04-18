// Send technology workflow notifications (site survey + installation lifecycle)
// Notification types:
//   - survey_requested:  deal entered site_survey stage  -> tech alias
//   - survey_assigned:   engineer assigned to a survey   -> engineer
//   - survey_closed:     survey marked completed         -> tech alias
//   - install_assigned:  engineer assigned to install    -> engineer
//   - install_closed:    install marked completed        -> tech alias

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/microsoft_outlook';
const TECH_ALIAS = 'technology@iklickgh.com';
const FINANCE_ALIAS = 'finance@iklickgh.com';

type NotifyType =
  | 'survey_requested'
  | 'survey_assigned'
  | 'survey_closed'
  | 'survey_completed_to_sales'
  | 'install_assigned'
  | 'install_closed'
  | 'install_completed_to_finance'
  | 'deal_won_to_tech';

interface Payload {
  type: NotifyType;
  deal_title?: string;
  deal_id?: string;
  client_name?: string;
  location?: string;
  isp_category?: string;
  scheduled_date?: string;
  notes?: string;
  engineer_name?: string;
  engineer_email?: string;
  sales_rep_name?: string;
  sales_rep_email?: string;
  assigned_by_name?: string;
  feasibility?: string;
  cost_estimate?: number | null;
  mrc?: number | null;
  nrc?: number | null;
  service_type?: string;
}

const buildEmail = (p: Payload): { subject: string; html: string; toAlias: boolean } => {
  const dealLine = p.deal_title ? `<strong>Deal:</strong> ${p.deal_title}` : '';
  const clientLine = p.client_name ? `<br/><strong>Client:</strong> ${p.client_name}` : '';
  const locationLine = p.location ? `<br/><strong>Location:</strong> ${p.location}` : '';
  const categoryLine = p.isp_category ? `<br/><strong>Category:</strong> ${p.isp_category}` : '';
  const scheduledLine = p.scheduled_date ? `<br/><strong>Scheduled:</strong> ${p.scheduled_date}` : '';
  const notesLine = p.notes ? `<br/><strong>Notes:</strong> ${p.notes}` : '';

  const wrap = (heading: string, intro: string, footer = '') => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; color: #1a1a1a;">
      <h2 style="color: #1a1a1a; margin: 0 0 12px;">${heading}</h2>
      <p style="margin: 0 0 16px;">${intro}</p>
      <div style="background:#f5f7fa;padding:14px 16px;border-radius:8px;border-left:4px solid #2563eb;">
        ${dealLine}${clientLine}${locationLine}${categoryLine}${scheduledLine}${notesLine}
      </div>
      ${footer ? `<p style="margin: 16px 0 0; font-size: 13px; color:#555;">${footer}</p>` : ''}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 12px;"/>
      <p style="font-size:12px;color:#888;margin:0;">iKlick Communications · Technology Operations</p>
    </div>
  `;

  switch (p.type) {
    case 'survey_requested':
      return {
        toAlias: true,
        subject: `[Site Survey Requested] ${p.deal_title ?? 'New deal'}`,
        html: wrap(
          'New Site Survey Requested',
          `A deal has moved into the <strong>Site Survey</strong> stage. Please assign an engineer.`,
          'Open the CRM Survey Queue to assign and schedule.'
        ),
      };
    case 'survey_assigned':
      return {
        toAlias: false,
        subject: `[Site Survey Assigned] ${p.deal_title ?? ''}`,
        html: wrap(
          `Hello ${p.engineer_name ?? 'Engineer'},`,
          `You have been assigned to a site survey${p.assigned_by_name ? ` by ${p.assigned_by_name}` : ''}. Please review and confirm the schedule.`,
          'Login to the CRM to view full details.'
        ),
      };
    case 'survey_closed': {
      const feas = p.feasibility ? `<br/><strong>Feasibility:</strong> ${p.feasibility}` : '';
      const cost = p.cost_estimate ? `<br/><strong>Cost Estimate:</strong> ₵${p.cost_estimate}` : '';
      return {
        toAlias: true,
        subject: `[Site Survey Completed] ${p.deal_title ?? ''}`,
        html: wrap(
          'Site Survey Completed',
          `The site survey has been marked <strong>completed</strong>${p.engineer_name ? ` by ${p.engineer_name}` : ''}.`,
          'Review the survey outcome and prepare next steps.'
        ).replace('</div>\n      ', `${feas}${cost}</div>\n      `),
      };
    }
    case 'install_assigned':
      return {
        toAlias: false,
        subject: `[Installation Assigned] ${p.deal_title ?? ''}`,
        html: wrap(
          `Hello ${p.engineer_name ?? 'Engineer'},`,
          `You have been assigned to an installation${p.assigned_by_name ? ` by ${p.assigned_by_name}` : ''}. Please coordinate with the client and confirm the schedule.`,
          'Login to the CRM to view full details.'
        ),
      };
    case 'install_closed':
      return {
        toAlias: true,
        subject: `[Installation Completed] ${p.deal_title ?? ''}`,
        html: wrap(
          'Installation Completed',
          `The installation has been marked <strong>completed</strong>${p.engineer_name ? ` by ${p.engineer_name}` : ''}.`,
          'Service is now ready for handover to operations.'
        ),
      };
  }
};

const sendMail = async (to: string, subject: string, html: string) => {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const OUTLOOK_KEY = Deno.env.get('MICROSOFT_OUTLOOK_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');
  if (!OUTLOOK_KEY) throw new Error('MICROSOFT_OUTLOOK_API_KEY is not configured');

  const res = await fetch(`${GATEWAY_URL}/me/sendMail`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': OUTLOOK_KEY,
    },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: 'HTML', content: html },
        toRecipients: [{ emailAddress: { address: to } }],
      },
    }),
  });
  if (!res.ok && res.status !== 202) {
    const text = await res.text();
    throw new Error(`Outlook send failed [${res.status}]: ${text}`);
  }
  return true;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload = (await req.json()) as Payload;
    if (!payload?.type) {
      return new Response(JSON.stringify({ error: 'Missing type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { subject, html, toAlias } = buildEmail(payload);
    const recipients: string[] = [];

    if (toAlias) recipients.push(TECH_ALIAS);
    if (!toAlias && payload.engineer_email) recipients.push(payload.engineer_email);

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'No recipient resolved' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: Record<string, string> = {};
    for (const to of recipients) {
      try {
        await sendMail(to, subject, html);
        results[to] = 'sent';
      } catch (err) {
        console.error('send-tech-email error', to, err);
        results[to] = `failed: ${(err as Error).message}`;
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-tech-email fatal', err);
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
