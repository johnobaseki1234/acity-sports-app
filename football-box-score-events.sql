-- VANGUARD — Football (ACFL) Box Score Telemetry
-- Run ONCE in Supabase → SQL Editor, after network-provisioning-setup.sql.
-- Adds Save, Shot, Shot on Target, Tackle Won, Interception event types so
-- the scorer console can log the data the ACFL match box score needs.
-- Purely additive — existing goal/assist/card/penalty events are untouched.

update sports
set event_types = '[
  {"type":"goal","label":"Goal","affects_score":true,"score_value":1,"requires_player":true,"color":"green","icon":"⚽"},
  {"type":"assist","label":"Assist","affects_score":false,"requires_player":true,"color":"blue","icon":"🅰️"},
  {"type":"own_goal","label":"Own Goal","affects_score":true,"score_value":-1,"requires_player":true,"color":"red","icon":"⚽"},
  {"type":"shot_on_target","label":"Shot on Target","affects_score":false,"requires_player":true,"color":"blue","icon":"🎯"},
  {"type":"shot","label":"Shot (Off Target)","affects_score":false,"requires_player":true,"color":"gray","icon":"👟"},
  {"type":"save","label":"Save","affects_score":false,"requires_player":true,"color":"blue","icon":"🧤"},
  {"type":"tackle_won","label":"Tackle Won","affects_score":false,"requires_player":true,"color":"yellow","icon":"🦵"},
  {"type":"interception","label":"Interception","affects_score":false,"requires_player":true,"color":"blue","icon":"🛡️"},
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
