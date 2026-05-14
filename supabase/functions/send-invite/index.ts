import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvitePayload {
  family_id:    string;
  partner_email: string;
  invite_code:  string;
}

// ─── Email HTML ───────────────────────────────────────────────────────────────

function buildEmailHtml(familyName: string, inviteCode: string, deepLink: string, webLink: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Join ${familyName} on Doable</title>
</head>
<body style="margin:0;padding:0;background:#f5f3ff;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#fff;border-radius:16px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,.08);">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <div style="font-size:48px;">🏠</div>
              <h1 style="margin:16px 0 8px;font-size:24px;font-weight:700;color:#1f1235;">
                You're invited to join<br/><span style="color:#7c3aed;">${familyName}</span>
              </h1>
              <p style="margin:0;color:#6b7280;font-size:15px;">
                Someone wants you to join their family on <strong>Doable</strong> — the family task &amp; habit tracker.
              </p>
            </td>
          </tr>

          <!-- Invite code badge -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <div style="display:inline-block;background:#f5f3ff;border:2px solid #ddd6fe;border-radius:12px;padding:16px 32px;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:.08em;color:#7c3aed;text-transform:uppercase;">Your invite code</p>
                <p style="margin:0;font-size:32px;font-weight:800;letter-spacing:.2em;color:#4c1d95;">${inviteCode}</p>
              </div>
            </td>
          </tr>

          <!-- CTA buttons -->
          <tr>
            <td align="center" style="padding-bottom:12px;">
              <a href="${deepLink}"
                 style="display:inline-block;background:#7c3aed;color:#fff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;">
                Open in Doable App
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <a href="${webLink}"
                 style="font-size:13px;color:#7c3aed;text-decoration:underline;">
                Or join via the web instead
              </a>
            </td>
          </tr>

          <!-- How to use code -->
          <tr>
            <td style="background:#f9fafb;border-radius:10px;padding:16px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;">How to join manually:</p>
              <ol style="margin:0;padding-left:18px;color:#6b7280;font-size:13px;line-height:1.7;">
                <li>Download <strong>Doable</strong> from the App Store or Google Play</li>
                <li>Sign in or create an account</li>
                <li>Tap <em>Family → Join Family</em> and enter the code above</li>
              </ol>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                This invite was sent by someone in the <strong>${familyName}</strong> family group.<br/>
                If you didn't expect this, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    // ── Auth: verify caller is an authenticated Supabase user ──
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── Parse body ──
    const { family_id, partner_email, invite_code }: InvitePayload = await req.json();

    if (!family_id || !partner_email || !invite_code) {
      return new Response(JSON.stringify({ error: 'family_id, partner_email, and invite_code are required' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── Verify caller belongs to this family ──
    const { data: membership, error: memberErr } = await supabase
      .from('family_members')
      .select('role')
      .eq('family_id', family_id)
      .eq('user_id', user.id)
      .single();

    if (memberErr || !membership) {
      return new Response(JSON.stringify({ error: 'You are not a member of this family' }), {
        status: 403, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── Fetch family name ──
    const { data: family, error: familyErr } = await supabase
      .from('families')
      .select('name')
      .eq('id', family_id)
      .single();

    if (familyErr || !family) {
      return new Response(JSON.stringify({ error: 'Family not found' }), {
        status: 404, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── Build links ──
    const deepLink = `doable://invite?code=${invite_code}`;
    const webLink  = `${Deno.env.get('APP_URL') ?? 'https://doable.app'}/join?code=${invite_code}`;

    // ── Send email via Resend ──
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    'Doable App <invites@doable.app>',
        to:      [partner_email],
        subject: `You're invited to join ${family.name} on Doable!`,
        html:    buildEmailHtml(family.name, invite_code, deepLink, webLink),
      }),
    });

    if (!resendRes.ok) {
      const resendError = await resendRes.json();
      console.error('Resend error:', resendError);
      return new Response(JSON.stringify({ error: 'Failed to send email', detail: resendError }), {
        status: 502, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const resendData = await resendRes.json();

    return new Response(
      JSON.stringify({ success: true, email_id: resendData.id }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } },
    );

  } catch (err) {
    console.error('Unhandled error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
