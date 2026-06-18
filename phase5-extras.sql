-- ACity Sports App — Phase 5 extras
-- Run ONCE in Supabase → SQL Editor.
-- Adds: new basketball/football tracking events, cross-sport athlete linking,
-- and the notifications queue used by the /api/match-events pipeline.

-- ============================================================
-- 1. EXPANDED BASKETBALL EVENTS (adds Assist, Steal, Block, Rebound)
--    These are non-scoring, so the score trigger is unaffected.
-- ============================================================
update sports
set event_types = '[
  {"type":"points_2","label":"2-Point FG","affects_score":true,"score_value":2,"requires_player":true,"color":"green","icon":"🏀"},
  {"type":"points_3","label":"3-Point FG","affects_score":true,"score_value":3,"requires_player":true,"color":"green","icon":"🎯"},
  {"type":"free_throw_made","label":"Free Throw (Made)","affects_score":true,"score_value":1,"requires_player":true,"color":"green","icon":"🏀"},
  {"type":"free_throw_missed","label":"Free Throw (Missed)","affects_score":false,"requires_player":true,"color":"gray","icon":"❌"},
  {"type":"assist","label":"Assist","affects_score":false,"requires_player":true,"color":"blue","icon":"🅰️"},
  {"type":"rebound","label":"Rebound","affects_score":false,"requires_player":true,"color":"blue","icon":"↩️"},
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

-- ============================================================
-- 2. FOOTBALL — add an Assist event (used by player profiles)
-- ============================================================
update sports
set event_types = '[
  {"type":"goal","label":"Goal","affects_score":true,"score_value":1,"requires_player":true,"color":"green","icon":"⚽"},
  {"type":"assist","label":"Assist","affects_score":false,"requires_player":true,"color":"blue","icon":"🅰️"},
  {"type":"own_goal","label":"Own Goal","affects_score":true,"score_value":-1,"requires_player":true,"color":"red","icon":"⚽"},
  {"type":"yellow_card","label":"Yellow Card","affects_score":false,"requires_player":true,"color":"yellow","icon":"🟨"},
  {"type":"red_card","label":"Red Card","affects_score":false,"requires_player":true,"color":"red","icon":"🟥"},
  {"type":"substitution","label":"Substitution","affects_score":false,"requires_player":true,"color":"blue","icon":"🔄"},
  {"type":"penalty_scored","label":"Penalty (Scored)","affects_score":true,"score_value":1,"requires_player":true,"color":"green","icon":"⚽"},
  {"type":"penalty_missed","label":"Penalty (Missed)","affects_score":false,"requires_player":true,"color":"gray","icon":"❌"},
  {"type":"half_start","label":"Kick-off","affects_score":false,"requires_player":false,"color":"gray","icon":"▶️"},
  {"type":"half_end","label":"Half End","affects_score":false,"requires_player":false,"color":"gray","icon":"⏸️"},
  {"type":"match_end","label":"Full Time","affects_score":false,"requires_player":false,"color":"gray","icon":"⏹️"}
]'::jsonb
where slug = 'football';

-- ============================================================
-- 3. CROSS-SPORT ATHLETE LINKING
--    Players sharing the same athlete_key are the same student.
-- ============================================================
alter table players add column if not exists athlete_key text;
create index if not exists idx_players_athlete_key on players(athlete_key);

-- ============================================================
-- 4. NOTIFICATIONS QUEUE (written by /api/match-events)
-- ============================================================
create table if not exists notifications (
  id          uuid primary key default uuid_generate_v4(),
  match_id    uuid references matches(id) on delete cascade,
  event_id    uuid references match_events(id) on delete set null,
  channel     text not null default 'whatsapp',
  payload     text not null,
  status      text not null default 'queued',  -- queued | sent | failed
  created_at  timestamptz default now()
);

alter table notifications enable row level security;
drop policy if exists "Public read notifications" on notifications;
create policy "Public read notifications" on notifications for select using (true);
drop policy if exists "Dev write notifications" on notifications;
create policy "Dev write notifications" on notifications for all using (true) with check (true);

grant select, insert, update, delete on notifications to anon, authenticated;

-- Optional: stream the queue in realtime to a future sender worker.
alter publication supabase_realtime add table notifications;
