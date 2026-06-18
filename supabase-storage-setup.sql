-- ACity Sports App — Storage buckets + dev upload access
-- Run this ONCE in Supabase → SQL Editor.
--
-- Why: The admin Team/Player forms upload logos & photos to Supabase Storage.
-- Buckets must exist AND storage.objects needs RLS policies — public buckets
-- allow public READS, but uploads (INSERT) are blocked for the anon role by
-- default. While auth is disabled for testing, we open uploads for these two
-- buckets. Tighten before production (cleanup block at bottom).

-- ============================================================
-- 1. CREATE PUBLIC BUCKETS (idempotent)
-- ============================================================
insert into storage.buckets (id, name, public)
values
  ('team-logos', 'team-logos', true),
  ('player-photos', 'player-photos', true)
on conflict (id) do update set public = excluded.public;

-- ============================================================
-- 2. DEV STORAGE POLICIES (open read + write for the 2 buckets)
-- ============================================================

-- Public read (anyone can view the images)
drop policy if exists "Public read sports media" on storage.objects;
create policy "Public read sports media" on storage.objects
  for select using (bucket_id in ('team-logos', 'player-photos'));

-- Dev upload (anon can insert while auth is disabled)
drop policy if exists "Dev upload sports media" on storage.objects;
create policy "Dev upload sports media" on storage.objects
  for insert with check (bucket_id in ('team-logos', 'player-photos'));

-- Dev update (anon can overwrite/replace)
drop policy if exists "Dev update sports media" on storage.objects;
create policy "Dev update sports media" on storage.objects
  for update using (bucket_id in ('team-logos', 'player-photos'));

-- Dev delete (anon can remove)
drop policy if exists "Dev delete sports media" on storage.objects;
create policy "Dev delete sports media" on storage.objects
  for delete using (bucket_id in ('team-logos', 'player-photos'));

-- ============================================================
-- 3. PRODUCTION CLEANUP (run before launch — do NOT run now)
-- ============================================================
-- Replace the open write policies below with authenticated-only versions.
-- drop policy if exists "Dev upload sports media" on storage.objects;
-- drop policy if exists "Dev update sports media" on storage.objects;
-- drop policy if exists "Dev delete sports media" on storage.objects;
--
-- create policy "Auth upload sports media" on storage.objects
--   for insert with check (
--     bucket_id in ('team-logos', 'player-photos') and auth.role() = 'authenticated'
--   );
