/**
 * Supabase Edge Function: send-push
 *
 * Sends an FCM push notification to a specific user's device.
 * Can be called from another Edge Function, a cron job, or a database trigger.
 *
 * Prerequisites:
 *   1. Create a Firebase project at console.firebase.google.com
 *   2. Go to Project Settings → Service Accounts → Generate new private key
 *   3. Add the following secrets to Supabase (Dashboard → Edge Functions → Secrets):
 *        FIREBASE_PROJECT_ID   — your Firebase project ID
 *        FIREBASE_CLIENT_EMAIL — service account email from the JSON key
 *        FIREBASE_PRIVATE_KEY  — private key from the JSON key (include \n characters)
 *
 * Request body (JSON):
 *   { userId: string, title: string, body: string, data?: Record<string,string> }
 *
 * Example curl:
 *   curl -X POST https://<project>.supabase.co/functions/v1/send-push \
 *     -H "Authorization: Bearer <anon-key>" \
 *     -H "Content-Type: application/json" \
 *     -d '{"userId":"abc123","title":"Test","body":"Hello from server!"}'
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID')!;
const FIREBASE_CLIENT_EMAIL = Deno.env.get('FIREBASE_CLIENT_EMAIL')!;
const FIREBASE_PRIVATE_KEY = Deno.env.get('FIREBASE_PRIVATE_KEY')!.replace(/\\n/g, '\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── OAuth2 token for FCM v1 API ───────────────────────────────────────────────

async function getFcmAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: FIREBASE_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const signingInput = `${encode(header)}.${encode(payload)}`;

  // Import private key
  const keyData = FIREBASE_PRIVATE_KEY
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const jwt = `${signingInput}.${sig}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const tokenJson = await tokenRes.json();
  return tokenJson.access_token as string;
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body: { userId: string; title: string; body: string; data?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { userId, title, body: messageBody, data } = body;
  if (!userId || !title || !messageBody) {
    return new Response('Missing required fields: userId, title, body', { status: 400 });
  }

  // Look up FCM token for this user
  const { data: row, error } = await supabase
    .from('fcm_tokens')
    .select('token')
    .eq('user_id', userId)
    .single();

  if (error || !row) {
    return new Response(JSON.stringify({ error: 'No FCM token found for user' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const accessToken = await getFcmAccessToken();

  const fcmRes = await fetch(
    `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token: row.token,
          notification: { title, body: messageBody },
          data: data ?? {},
          android: {
            notification: {
              channel_id: 'doable_alarms',
              priority: 'HIGH',
              default_sound: true,
              default_vibrate_timings: true,
            },
            priority: 'HIGH',
          },
        },
      }),
    },
  );

  const fcmJson = await fcmRes.json();
  if (!fcmRes.ok) {
    return new Response(JSON.stringify({ error: fcmJson }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, messageId: fcmJson.name }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
