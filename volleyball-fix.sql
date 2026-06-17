-- Volleyball scoring fix — run once in Supabase SQL Editor
-- Run this BEFORE starting any volleyball matches.

-- ============================================================
-- 1. Update DB trigger to skip volleyball
--    Volleyball scores (sets won) are managed by the app per-set.
--    The trigger still fires, but exits early for volleyball matches.
-- ============================================================
create or replace function update_match_score()
returns trigger language plpgsql security definer as $$
declare
  sport_rules jsonb;
  sport_slug  text;
  home_id uuid;
  away_id uuid;
  new_home int := 0;
  new_away int := 0;
begin
  select m.home_team_id, m.away_team_id, s.scoring_rules, s.slug
    into home_id, away_id, sport_rules, sport_slug
    from matches m
    join seasons se on se.id = m.season_id
    join sports s   on s.id  = se.sport_id
    where m.id = coalesce(new.match_id, old.match_id);

  -- Volleyball: home_score / away_score = sets won, updated by the app on set end.
  -- Do not auto-sum points here.
  if sport_slug = 'volleyball' then
    return coalesce(new, old);
  end if;

  -- Football & Basketball: sum scoring events as before.
  select
    coalesce(sum(case when me.team_id = home_id then (sport_rules->>(me.event_type))::int else 0 end), 0),
    coalesce(sum(case when me.team_id = away_id then (sport_rules->>(me.event_type))::int else 0 end), 0)
  into new_home, new_away
  from match_events me
  where me.match_id = coalesce(new.match_id, old.match_id)
    and (sport_rules->>(me.event_type)) is not null;

  update matches
  set home_score = new_home, away_score = new_away
  where id = coalesce(new.match_id, old.match_id);

  return coalesce(new, old);
end;
$$;

-- ============================================================
-- 2. Replace volleyball event_types — adds set_start
-- ============================================================
update sports
set event_types = '[
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
]'::jsonb
where slug = 'volleyball';

-- ============================================================
-- 3. Standings config for volleyball seasons (no draws)
--    Run this after creating a volleyball season. Replace the name.
-- ============================================================
-- UPDATE seasons
-- SET standings_config = '{"points_win": 2, "points_draw": 0, "points_loss": 0}'::jsonb
-- WHERE name = 'YOUR VOLLEYBALL SEASON NAME';
