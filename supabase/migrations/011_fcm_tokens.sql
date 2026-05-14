-- Stores FCM device tokens so the Edge Function can send targeted push notifications.
-- One row per user (upsert on user_id).
create table if not exists fcm_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null unique,
  token       text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table fcm_tokens enable row level security;

-- Users can only read/write their own token
create policy "fcm_tokens: own row" on fcm_tokens
  for all using (auth.uid()::text = user_id);

-- Service role (Edge Function) bypasses RLS automatically
