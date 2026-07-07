-- VANGUARD — Network Provisioning + NCAA Telemetry
-- Run ONCE in Supabase → SQL Editor, after supabase-schema.sql and phase5-extras.sql.
-- Adds: schools (multi-university), season→school linkage, user league
-- preferences (onboarding), offensive/defensive rebound split, and a
-- games-played view for per-game averages.

-- ============================================================
-- 1. SCHOOLS (multi-university foundation)
-- ============================================================
create table if not exists schools (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  short_name    text not null,
  slug          text unique not null,
  primary_color text not null default '#CCFF00',
  created_at    timestamptz default now()
);

alter table schools enable row level security;
drop policy if exists "Public read schools" on schools;
create policy "Public read schools" on schools for select using (true);
drop policy if exists "Dev write schools" on schools;
create policy "Dev write schools" on schools for all using (true) with check (true);

insert into schools (name, short_name, slug, primary_color) values
  ('Academic City University', 'AC', 'academicity', '#CCFF00'),
  ('Ashesi University',        'ASH', 'ashesi',      '#E50914')
on conflict (slug) do nothing;

-- ============================================================
-- 2. SEASONS → SCHOOL LINKAGE ("League of Interest" grouping)
--    A season row IS a league instance (e.g. "ACFL Season 1"), so we
--    attach it to the school it belongs to rather than adding a
--    separate leagues table.
-- ============================================================
alter table seasons add column if not exists school_id uuid references schools(id) on delete set null;

-- Backfill: every existing season belongs to the founding partner.
update seasons set school_id = (select id from schools where slug = 'academicity')
where school_id is null;

grant select, insert, update, delete on schools to anon, authenticated;

-- ============================================================
-- 3. USER LEAGUE PREFERENCES (onboarding "Leagues of Interest")
-- ============================================================
create table if not exists user_preferences (
  user_id               uuid primary key references auth.users(id) on delete cascade,
  favorite_season_ids   uuid[] not null default '{}',
  onboarding_completed  boolean not null default false,
  updated_at            timestamptz default now()
);

alter table user_preferences enable row level security;
drop policy if exists "Read own preferences" on user_preferences;
create policy "Read own preferences" on user_preferences for select using (user_id = auth.uid());
drop policy if exists "Write own preferences" on user_preferences;
create policy "Write own preferences" on user_preferences for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on user_preferences to authenticated;

-- ============================================================
-- 4. BASKETBALL — split Rebound into Offensive / Defensive
-- ============================================================
update sports
set event_types = '[
  {"type":"points_2","label":"2-Point FG","affects_score":true,"score_value":2,"requires_player":true,"color":"green","icon":"🏀"},
  {"type":"points_3","label":"3-Point FG","affects_score":true,"score_value":3,"requires_player":true,"color":"green","icon":"🎯"},
  {"type":"free_throw_made","label":"Free Throw (Made)","affects_score":true,"score_value":1,"requires_player":true,"color":"green","icon":"🏀"},
  {"type":"free_throw_missed","label":"Free Throw (Missed)","affects_score":false,"requires_player":true,"color":"gray","icon":"❌"},
  {"type":"assist","label":"Assist","affects_score":false,"requires_player":true,"color":"blue","icon":"🅰️"},
  {"type":"rebound_offensive","label":"Off. Rebound","affects_score":false,"requires_player":true,"color":"blue","icon":"↩️"},
  {"type":"rebound_defensive","label":"Def. Rebound","affects_score":false,"requires_player":true,"color":"blue","icon":"↩️"},
  {"type":"steal","label":"Steal","affects_score":false,"requires_player":true,"color":"yellow","icon":"✋"},
  {"type":"block","label":"Block","affects_score":false,"requires_player":true,"color":"blue","icon":"🧱"},
  {"type":"foul","label":"Foul","affects_score":false,"requires_player":true,"color":"yellow","icon":"🟨"},
  {"type":"technical_foul","label":"Technical Foul","affects_score":false,"requires_player":true,"color":"red","icon":"🟥"},
  {"type":"substitution","label":"Substitution","affects_score":false,"requires_player":true,"color":"blue","icon":"🔄"},
  {"type":"timeout","label":"Timeout","affects_score":false,"requires_player":false,"color":"gray","icon":"⏱️"},
  {"type":"quarter_start","label":"Quarter Start","affects_score":false,"requires_player":false,"color":"gray","icon":"▶️"},
  {"type":"quarter_end","label":"Quarter End","affects_score":false,"requires_player":false,"color":"gray","icon":"⏸️"},
  {"type":"match_end","label":"Game Over","affects_score":false,"requires_player":false,"color":"gray","icon":"⏹️"}
]'::jsonb
where slug = 'basketball';

-- Existing rows logged under the old generic "rebound" type are left as-is
-- for history; new events use the split types. Stat readers treat legacy
-- "rebound" rows as an unclassified total, not fabricated as either split.

-- ============================================================
-- 5. GAMES-PLAYED VIEW (for PPG/RPG/APG-style per-game averages)
--    Counts each player's distinct finished matches, derived straight
--    from match_events — no separate stats table required.
-- ============================================================
create or replace view player_game_counts as
select
  me.player_id,
  count(distinct me.match_id) as games_played
from match_events me
join matches m on m.id = me.match_id
where me.player_id is not null
  and m.status = 'finished'
group by me.player_id;

grant select on player_game_counts to anon, authenticated;
