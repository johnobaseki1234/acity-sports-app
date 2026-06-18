-- ACity Sports App — Supabase Schema
-- Run this in the Supabase SQL Editor

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";

-- Public image buckets used by the admin upload forms.
insert into storage.buckets (id, name, public)
values ('team-logos', 'team-logos', true), ('player-photos', 'player-photos', true)
on conflict (id) do update set public = excluded.public;

-- ============================================================
-- SPORTS
-- ============================================================
create table if not exists sports (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  slug         text unique not null,
  icon         text not null default '🏆',
  event_types  jsonb not null default '[]',
  scoring_rules jsonb not null default '{}',
  periods      jsonb not null default '{}',
  created_at   timestamptz default now()
);

alter table sports enable row level security;
create policy "Public read sports" on sports for select using (true);
create policy "Admin insert sports" on sports for insert with check (auth.role() = 'authenticated');
create policy "Admin update sports" on sports for update using (auth.role() = 'authenticated');

-- Seed sports
insert into sports (name, slug, icon, event_types, scoring_rules, periods) values
(
  'Football', 'football', '⚽',
  '[
    {"type":"goal","label":"Goal","affects_score":true,"score_value":1,"requires_player":true,"color":"green","icon":"⚽"},
    {"type":"own_goal","label":"Own Goal","affects_score":true,"score_value":-1,"requires_player":true,"color":"red","icon":"⚽"},
    {"type":"yellow_card","label":"Yellow Card","affects_score":false,"requires_player":true,"color":"yellow","icon":"🟨"},
    {"type":"red_card","label":"Red Card","affects_score":false,"requires_player":true,"color":"red","icon":"🟥"},
    {"type":"substitution","label":"Substitution","affects_score":false,"requires_player":true,"color":"blue","icon":"🔄"},
    {"type":"penalty_scored","label":"Penalty (Scored)","affects_score":true,"score_value":1,"requires_player":true,"color":"green","icon":"⚽"},
    {"type":"penalty_missed","label":"Penalty (Missed)","affects_score":false,"requires_player":true,"color":"gray","icon":"❌"},
    {"type":"half_start","label":"Kick-off","affects_score":false,"requires_player":false,"color":"gray","icon":"▶️"},
    {"type":"half_end","label":"Half End","affects_score":false,"requires_player":false,"color":"gray","icon":"⏸️"},
    {"type":"match_end","label":"Full Time","affects_score":false,"requires_player":false,"color":"gray","icon":"⏹️"}
  ]',
  '{"goal":1,"own_goal":1,"penalty_scored":1}',
  '{"count":2,"name":"Half","duration_minutes":45}'
),
(
  'Basketball', 'basketball', '🏀',
  '[
    {"type":"points_2","label":"2-Point FG","affects_score":true,"score_value":2,"requires_player":true,"color":"green","icon":"🏀"},
    {"type":"points_3","label":"3-Point FG","affects_score":true,"score_value":3,"requires_player":true,"color":"green","icon":"🏀"},
    {"type":"free_throw_made","label":"Free Throw (Made)","affects_score":true,"score_value":1,"requires_player":true,"color":"green","icon":"🏀"},
    {"type":"free_throw_missed","label":"Free Throw (Missed)","affects_score":false,"requires_player":true,"color":"gray","icon":"❌"},
    {"type":"foul","label":"Foul","affects_score":false,"requires_player":true,"color":"yellow","icon":"🟨"},
    {"type":"technical_foul","label":"Technical Foul","affects_score":false,"requires_player":true,"color":"red","icon":"🟥"},
    {"type":"substitution","label":"Substitution","affects_score":false,"requires_player":true,"color":"blue","icon":"🔄"},
    {"type":"timeout","label":"Timeout","affects_score":false,"requires_player":false,"color":"gray","icon":"⏱️"},
    {"type":"quarter_start","label":"Quarter Start","affects_score":false,"requires_player":false,"color":"gray","icon":"▶️"},
    {"type":"quarter_end","label":"Quarter End","affects_score":false,"requires_player":false,"color":"gray","icon":"⏸️"},
    {"type":"match_end","label":"Game Over","affects_score":false,"requires_player":false,"color":"gray","icon":"⏹️"}
  ]',
  '{"points_2":2,"points_3":3,"free_throw_made":1}',
  '{"count":4,"name":"Quarter","duration_minutes":10}'
),
(
  'Volleyball', 'volleyball', '🏐',
  '[
    {"type":"point","label":"Point","affects_score":true,"score_value":1,"requires_player":false,"color":"green","icon":"🏐"},
    {"type":"ace","label":"Ace","affects_score":true,"score_value":1,"requires_player":true,"color":"green","icon":"🏐"},
    {"type":"block","label":"Block","affects_score":true,"score_value":1,"requires_player":true,"color":"blue","icon":"🛡️"},
    {"type":"kill","label":"Kill","affects_score":true,"score_value":1,"requires_player":true,"color":"green","icon":"💥"},
    {"type":"service_error","label":"Service Error","affects_score":false,"requires_player":true,"color":"red","icon":"❌"},
    {"type":"substitution","label":"Substitution","affects_score":false,"requires_player":true,"color":"blue","icon":"🔄"},
    {"type":"timeout","label":"Timeout","affects_score":false,"requires_player":false,"color":"gray","icon":"⏱️"},
    {"type":"set_start","label":"Set Start","affects_score":false,"requires_player":false,"color":"gray","icon":"▶️"},
    {"type":"set_end","label":"Set End","affects_score":false,"requires_player":false,"color":"gray","icon":"⏸️"},
    {"type":"match_end","label":"Match End","affects_score":false,"requires_player":false,"color":"gray","icon":"⏹️"}
  ]',
  '{"point":1,"ace":1,"block":1,"kill":1}',
  '{"count":5,"name":"Set","duration_minutes":null}'
)
on conflict (slug) do nothing;

-- ============================================================
-- TEAMS
-- ============================================================
create table if not exists teams (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  short_name       text not null,
  slug             text unique not null,
  logo_url         text,
  primary_color    text not null default '#1e3a5f',
  secondary_color  text not null default '#ffffff',
  created_at       timestamptz default now()
);

alter table teams enable row level security;
create policy "Public read teams" on teams for select using (true);
create policy "Admin write teams" on teams for all using (auth.role() = 'authenticated');

-- ============================================================
-- SEASONS
-- ============================================================
create table if not exists seasons (
  id                uuid primary key default uuid_generate_v4(),
  sport_id          uuid not null references sports(id) on delete restrict,
  name              text not null,
  start_date        date not null,
  end_date          date not null,
  is_active         boolean not null default false,
  standings_config  jsonb not null default '{"points_win":3,"points_draw":1,"points_loss":0}',
  created_at        timestamptz default now()
);

alter table seasons enable row level security;
create policy "Public read seasons" on seasons for select using (true);
create policy "Admin write seasons" on seasons for all using (auth.role() = 'authenticated');

-- ============================================================
-- SEASON TEAMS (join)
-- ============================================================
create table if not exists season_teams (
  id          uuid primary key default uuid_generate_v4(),
  season_id   uuid not null references seasons(id) on delete cascade,
  team_id     uuid not null references teams(id) on delete cascade,
  group_name  text,
  unique (season_id, team_id)
);

alter table season_teams enable row level security;
create policy "Public read season_teams" on season_teams for select using (true);
create policy "Admin write season_teams" on season_teams for all using (auth.role() = 'authenticated');

-- ============================================================
-- PLAYERS
-- ============================================================
create table if not exists players (
  id             uuid primary key default uuid_generate_v4(),
  team_id        uuid not null references teams(id) on delete cascade,
  name           text not null,
  jersey_number  int not null,
  position       text not null default '',
  secondary_position text,
  photo_url      text,
  is_active      boolean not null default true,
  created_at     timestamptz default now()
);

alter table players enable row level security;
create policy "Public read players" on players for select using (true);
create policy "Admin write players" on players for all using (auth.role() = 'authenticated');

-- ============================================================
-- MATCHES
-- ============================================================
create type match_status as enum ('scheduled','live','halftime','finished','postponed','cancelled');

create table if not exists matches (
  id                uuid primary key default uuid_generate_v4(),
  season_id         uuid not null references seasons(id) on delete restrict,
  home_team_id      uuid not null references teams(id) on delete restrict,
  away_team_id      uuid not null references teams(id) on delete restrict,
  scheduled_at      timestamptz not null,
  venue             text not null default '',
  status            match_status not null default 'scheduled',
  current_period    int not null default 0,
  period_start_time timestamptz,
  clock_running     boolean not null default false,
  home_score        int not null default 0,
  away_score        int not null default 0,
  home_sets         int[],
  away_sets         int[],
  scorer_id         uuid references auth.users(id) on delete set null,
  matchday          int,
  started_at        timestamptz,
  finished_at       timestamptz,
  created_at        timestamptz default now(),
  check (home_team_id != away_team_id)
);

alter table matches enable row level security;
create policy "Public read matches" on matches for select using (true);
create policy "Admin write matches" on matches for all using (auth.role() = 'authenticated');

-- ============================================================
-- MATCH EVENTS
-- ============================================================
create table if not exists match_events (
  id               uuid primary key default uuid_generate_v4(),
  match_id         uuid not null references matches(id) on delete cascade,
  event_type       text not null,
  team_id          uuid not null references teams(id) on delete restrict,
  player_id        uuid references players(id) on delete set null,
  assist_player_id uuid references players(id) on delete set null,
  period           int not null default 1,
  match_minute     int,
  details          jsonb,
  created_at       timestamptz default now(),
  created_by       uuid references auth.users(id) on delete set null
);

alter table match_events enable row level security;
create policy "Public read match_events" on match_events for select using (true);
create policy "Scorer insert match_events" on match_events for insert with check (auth.role() = 'authenticated');
create policy "Scorer delete match_events" on match_events for delete using (created_by = auth.uid());

-- ============================================================
-- TRIGGER: auto-update match score on event insert/delete
-- ============================================================
create or replace function update_match_score()
returns trigger language plpgsql security definer as $$
declare
  sport_rules jsonb;
  sport_slug text;
  home_id uuid;
  away_id uuid;
  new_home int := 0;
  new_away int := 0;
begin
  -- Get home/away team ids and sport scoring rules
  select m.home_team_id, m.away_team_id, s.scoring_rules, s.slug
    into home_id, away_id, sport_rules, sport_slug
    from matches m
    join seasons se on se.id = m.season_id
    join sports s on s.id = se.sport_id
    where m.id = coalesce(new.match_id, old.match_id);

  -- Volleyball match score is sets won. Live set points are computed from events.
  if sport_slug = 'volleyball' then
    return coalesce(new, old);
  end if;

  -- Sum scores from all scoring events for this match
  select
    coalesce(sum(case when me.team_id = home_id then (sport_rules->>(me.event_type))::int else 0 end), 0),
    coalesce(sum(case when me.team_id = away_id then (sport_rules->>(me.event_type))::int else 0 end), 0)
  into new_home, new_away
  from match_events me
  where me.match_id = coalesce(new.match_id, old.match_id)
    and (sport_rules->>(me.event_type)) is not null;

  update matches set home_score = new_home, away_score = new_away
  where id = coalesce(new.match_id, old.match_id);

  return coalesce(new, old);
end;
$$;

create trigger trg_update_match_score
after insert or delete on match_events
for each row execute function update_match_score();

-- ============================================================
-- ADMINS
-- ============================================================
create table if not exists admins (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid unique not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('super_admin','scorer')),
  name       text not null,
  created_at timestamptz default now()
);

alter table admins enable row level security;
create policy "Read own admin row" on admins for select using (user_id = auth.uid());
create policy "Super admin read all" on admins for select using (
  exists (select 1 from admins a where a.user_id = auth.uid() and a.role = 'super_admin')
);

-- ============================================================
-- REALTIME — enable publications
-- ============================================================
alter publication supabase_realtime add table matches;
alter publication supabase_realtime add table match_events;

-- ============================================================
-- GRANTS + DEV WRITE ACCESS
-- Re-run supabase-dev-access.sql if you reset the DB.
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

-- Dev-only: open writes while admin/scorer auth is disabled for testing.
-- See supabase-dev-access.sql for production cleanup.
drop policy if exists "Dev write sports" on sports;
create policy "Dev write sports" on sports for all using (true) with check (true);

drop policy if exists "Dev write teams" on teams;
create policy "Dev write teams" on teams for all using (true) with check (true);

drop policy if exists "Dev write seasons" on seasons;
create policy "Dev write seasons" on seasons for all using (true) with check (true);

drop policy if exists "Dev write season_teams" on season_teams;
create policy "Dev write season_teams" on season_teams for all using (true) with check (true);

drop policy if exists "Dev write players" on players;
create policy "Dev write players" on players for all using (true) with check (true);

drop policy if exists "Dev write matches" on matches;
create policy "Dev write matches" on matches for all using (true) with check (true);

drop policy if exists "Dev write match_events" on match_events;
create policy "Dev write match_events" on match_events for all using (true) with check (true);
