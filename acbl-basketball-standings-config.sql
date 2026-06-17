-- ACBL Season 8 — Basketball standings config (no draws, 2 pts per win)
-- Run once in Supabase SQL Editor

UPDATE seasons
SET standings_config = '{"points_win": 2, "points_draw": 0, "points_loss": 0}'::jsonb
WHERE name = 'ACBL Season 8';
