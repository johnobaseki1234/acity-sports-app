-- VANGUARD Stealth Mode — Run this in the Supabase SQL Editor
-- Gates the entire app behind a Supabase-auth allowlist while in private/pre-launch builds.

-- ============================================================
-- APP CONFIG (feature flags)
-- ============================================================
create table if not exists app_config (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz default now()
);

alter table app_config enable row level security;

-- Anyone (including anon middleware checks) can read the flags — no secrets stored here.
create policy "Public read app_config" on app_config for select using (true);
-- Only edit flags manually via the SQL editor / service role; no public write policy.

insert into app_config (key, value)
values ('stealth_mode_enabled', 'true')
on conflict (key) do nothing;

-- ============================================================
-- STEALTH ALLOWLIST
-- ============================================================
create table if not exists stealth_allowlist (
  email      text primary key,
  note       text,
  added_at   timestamptz default now()
);

alter table stealth_allowlist enable row level security;

-- A logged-in user may only check their OWN email — the full list is never exposed publicly.
create policy "Self read stealth_allowlist" on stealth_allowlist
  for select using (auth.jwt() ->> 'email' = email);

-- Seed yourself so you don't lock yourself out. Replace with your real email before running.
insert into stealth_allowlist (email, note)
values ('you@example.com', 'founder')
on conflict (email) do nothing;
