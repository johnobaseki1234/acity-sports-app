-- ACity Sports App — Fix "permission denied for table …"
-- Run this once in Supabase → SQL Editor
--
-- Why: Tables created via SQL Editor don't automatically grant INSERT/UPDATE/DELETE
-- to the anon/authenticated roles. RLS policies also require auth, but admin/scorer
-- are open for testing right now.
--
-- BEFORE PRODUCTION: run the cleanup block at the bottom of this file.

-- ============================================================
-- 1. TABLE-LEVEL GRANTS
-- ============================================================
grant usage on schema public to anon, authenticated, service_role;

grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to anon, authenticated;

grant usage, select on all sequences in schema public to anon, authenticated;

alter default privileges in schema public
  grant select on tables to anon, authenticated;
alter default privileges in schema public
  grant insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;

-- ============================================================
-- 2. DEV RLS POLICIES (open writes while auth is disabled)
--    These OR with existing authenticated-only policies.
-- ============================================================

-- Sports
drop policy if exists "Dev write sports" on sports;
create policy "Dev write sports" on sports for all using (true) with check (true);

-- Teams
drop policy if exists "Dev write teams" on teams;
create policy "Dev write teams" on teams for all using (true) with check (true);

-- Seasons
drop policy if exists "Dev write seasons" on seasons;
create policy "Dev write seasons" on seasons for all using (true) with check (true);

-- Season teams
drop policy if exists "Dev write season_teams" on season_teams;
create policy "Dev write season_teams" on season_teams for all using (true) with check (true);

-- Players
drop policy if exists "Dev write players" on players;
create policy "Dev write players" on players for all using (true) with check (true);

-- Matches
drop policy if exists "Dev write matches" on matches;
create policy "Dev write matches" on matches for all using (true) with check (true);

-- Match events (scorer insert + undo delete)
drop policy if exists "Dev write match_events" on match_events;
create policy "Dev write match_events" on match_events for all using (true) with check (true);

-- ============================================================
-- 3. PRODUCTION CLEANUP (run before launch — do NOT run now)
-- ============================================================
-- drop policy if exists "Dev write sports" on sports;
-- drop policy if exists "Dev write teams" on teams;
-- drop policy if exists "Dev write seasons" on seasons;
-- drop policy if exists "Dev write season_teams" on season_teams;
-- drop policy if exists "Dev write players" on players;
-- drop policy if exists "Dev write matches" on matches;
-- drop policy if exists "Dev write match_events" on match_events;
--
-- revoke insert, update, delete on all tables in schema public from anon;
