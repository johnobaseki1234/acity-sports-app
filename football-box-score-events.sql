-- VANGUARD — Football (ACFL) Box Score Telemetry
-- Run ONCE in Supabase → SQL Editor, after network-provisioning-setup.sql.
-- Adds Save, Shot, Shot on Target, Tackle Won, Interception event types so
-- the scorer console can log the data the ACFL match box score needs.
-- Purely additive — existing goal/assist/card/penalty events are untouched.
--
-- Targets: sports.event_types (jsonb column) — confirmed against
-- supabase-schema.sql, same statement shape phase5-extras.sql already
-- used successfully to extend basketball's event_types.
--
-- Uses dollar-quoting ($json$...$json$) instead of single-quoted string
-- literals for the JSON body. If your editor/clipboard auto-converts a
-- straight ' into a curly ' when pasting, a single-quoted string breaks
-- open mid-statement and Postgres ends up trying to parse the leftover
-- JSON as SQL — which surfaces as errors like relation "event_types"
-- does not exist. Dollar-quoting has no quote characters to corrupt.

update sports
set event_types = $json$[
  {"type":"goal","label":"Goal","affects_score":true,"score_value":1,"requires_player":true,"color":"green","icon":"soccer-ball"},
  {"type":"assist","label":"Assist","affects_score":false,"requires_player":true,"color":"blue","icon":"assist"},
  {"type":"own_goal","label":"Own Goal","affects_score":true,"score_value":-1,"requires_player":true,"color":"red","icon":"soccer-ball"},
  {"type":"shot_on_target","label":"Shot on Target","affects_score":false,"requires_player":true,"color":"blue","icon":"target"},
  {"type":"shot","label":"Shot (Off Target)","affects_score":false,"requires_player":true,"color":"gray","icon":"boot"},
  {"type":"save","label":"Save","affects_score":false,"requires_player":true,"color":"blue","icon":"gloves"},
  {"type":"tackle_won","label":"Tackle Won","affects_score":false,"requires_player":true,"color":"yellow","icon":"tackle"},
  {"type":"interception","label":"Interception","affects_score":false,"requires_player":true,"color":"blue","icon":"shield"},
  {"type":"yellow_card","label":"Yellow Card","affects_score":false,"requires_player":true,"color":"yellow","icon":"card-yellow"},
  {"type":"red_card","label":"Red Card","affects_score":false,"requires_player":true,"color":"red","icon":"card-red"},
  {"type":"substitution","label":"Substitution","affects_score":false,"requires_player":true,"color":"blue","icon":"substitution"},
  {"type":"penalty_scored","label":"Penalty (Scored)","affects_score":true,"score_value":1,"requires_player":true,"color":"green","icon":"soccer-ball"},
  {"type":"penalty_missed","label":"Penalty (Missed)","affects_score":false,"requires_player":true,"color":"gray","icon":"x"},
  {"type":"half_start","label":"Kick-off","affects_score":false,"requires_player":false,"color":"gray","icon":"play"},
  {"type":"half_end","label":"Half End","affects_score":false,"requires_player":false,"color":"gray","icon":"pause"},
  {"type":"match_end","label":"Full Time","affects_score":false,"requires_player":false,"color":"gray","icon":"stop"}
]$json$::jsonb
where slug = 'football';

-- Sanity check: confirm all 16 event types landed and the row updated.
select slug, jsonb_array_length(event_types) as event_type_count
from sports
where slug = 'football';
