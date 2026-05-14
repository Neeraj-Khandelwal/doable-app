/**
 * Local test for the send-invite Edge Function.
 *
 * Prerequisites:
 *   1. supabase start          (runs Supabase locally via Docker)
 *   2. supabase functions serve send-invite --env-file .env.local
 *   3. node test-local.mjs
 *
 * Fill in the three variables below before running.
 */

// ── Config — fill these in ────────────────────────────────────────────────────
const FUNCTION_URL   = 'http://localhost:54321/functions/v1/send-invite';
const USER_JWT       = 'PASTE_YOUR_JWT_HERE';   // from Supabase auth session
const FAMILY_ID      = 'PASTE_FAMILY_UUID_HERE';
const PARTNER_EMAIL  = 'test@example.com';
const INVITE_CODE    = 'ABC123';
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Sending test invite…\n');

  const res = await fetch(FUNCTION_URL, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${USER_JWT}`,
    },
    body: JSON.stringify({
      family_id:     FAMILY_ID,
      partner_email: PARTNER_EMAIL,
      invite_code:   INVITE_CODE,
    }),
  });

  const data = await res.json();

  console.log('Status :', res.status);
  console.log('Response:', JSON.stringify(data, null, 2));

  if (res.ok) {
    console.log('\n✅ Email sent. Check your Resend dashboard for delivery status.');
    console.log('   Email ID:', data.email_id);
  } else {
    console.error('\n❌ Request failed:', data.error);
  }
}

main().catch(console.error);
