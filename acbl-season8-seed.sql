-- ============================================================
-- ACBL Season 8 — Teams & Players Seed
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Insert the 4 basketball teams
INSERT INTO teams (name, short_name, slug, primary_color, secondary_color) VALUES
  ('Reapers',  'REP', 'reapers',  '#FF0000', '#ffffff'),
  ('Veterans', 'VET', 'veterans', '#000000', '#ffffff'),
  ('Snipers',  'SNI', 'snipers',  '#00FFFF', '#000000'),
  ('Olympus',  'OLY', 'olympus',  '#FFA500', '#000000')
ON CONFLICT (slug) DO NOTHING;

-- 2. Create ACBL Season 8 (only if it doesn't exist yet)
INSERT INTO seasons (sport_id, name, start_date, end_date, is_active)
SELECT id, 'ACBL Season 8', '2025-01-01', '2025-12-31', true
FROM sports WHERE slug = 'basketball'
AND NOT EXISTS (SELECT 1 FROM seasons WHERE name = 'ACBL Season 8');

-- 3. Link all 4 teams to ACBL Season 8
INSERT INTO season_teams (season_id, team_id)
SELECT s.id, t.id
FROM seasons s
CROSS JOIN teams t
WHERE s.name = 'ACBL Season 8'
  AND t.slug IN ('reapers', 'veterans', 'snipers', 'olympus')
ON CONFLICT DO NOTHING;

-- 4. Reapers players (14 players)
INSERT INTO players (team_id, name, jersey_number, position, is_active)
SELECT t.id, p.name, p.n::int, 'G', true
FROM teams t
CROSS JOIN (VALUES
  ('Jeremy', 1), ('Sam Dave', 2), ('Jesse', 3), ('Cornelius', 4),
  ('Alvin', 5), ('Bill Gates', 6), ('Lincoln', 7), ('Ebere', 8),
  ('CJ', 9), ('Andrew Amecks', 10), ('King David', 11), ('Malvin', 12),
  ('Kelvin Lartey', 13), ('Shemuel', 14)
) AS p(name, n)
WHERE t.slug = 'reapers'
  AND NOT EXISTS (SELECT 1 FROM players WHERE team_id = t.id LIMIT 1);

-- 5. Veterans players (16 players)
INSERT INTO players (team_id, name, jersey_number, position, is_active)
SELECT t.id, p.name, p.n::int, 'G', true
FROM teams t
CROSS JOIN (VALUES
  ('Rayan', 1), ('Jonathan', 2), ('Donald', 3), ('Benji', 4),
  ('Jesper', 5), ('Adrian', 6), ('Andrew', 7), ('Rodney', 8),
  ('Oheneba Amissa', 9), ('Lawer', 10), ('Alex', 11), ('Maxime', 12),
  ('Nana Kwadwo', 13), ('Stybo', 14), ('Mawuli', 15), ('Tobi', 16)
) AS p(name, n)
WHERE t.slug = 'veterans'
  AND NOT EXISTS (SELECT 1 FROM players WHERE team_id = t.id LIMIT 1);

-- 6. Snipers players (11 players)
INSERT INTO players (team_id, name, jersey_number, position, is_active)
SELECT t.id, p.name, p.n::int, 'G', true
FROM teams t
CROSS JOIN (VALUES
  ('David Obaseki', 1), ('KK', 2), ('John Obaseki', 3), ('George', 4),
  ('Kissi Asare', 5), ('Samuel Boateng', 6), ('Joshua Mishael', 7),
  ('Aaron', 8), ('Malcom Ashun', 9), ('Ishmael', 10), ('Kofi', 11)
) AS p(name, n)
WHERE t.slug = 'snipers'
  AND NOT EXISTS (SELECT 1 FROM players WHERE team_id = t.id LIMIT 1);

-- 7. Olympus players (16 players)
INSERT INTO players (team_id, name, jersey_number, position, is_active)
SELECT t.id, p.name, p.n::int, 'G', true
FROM teams t
CROSS JOIN (VALUES
  ('Wesley Turkson', 1), ('Robert Owoo', 2), ('Cheick Kader', 3),
  ('Latif', 4), ('Emmanuel Bonz', 5), ('Evan Guy-Samuel', 6),
  ('Warren Esonu', 7), ('Damiba Yohan', 8), ('Steven Okrah', 9),
  ('William Gyampe', 10), ('Daniel Thomas', 11), ('Stephen Adams', 12),
  ('Manuel Balinga', 13), ('Lionel Hunlede', 14), ('phillipe', 15),
  ('Emmanuel Abikoye', 16)
) AS p(name, n)
WHERE t.slug = 'olympus'
  AND NOT EXISTS (SELECT 1 FROM players WHERE team_id = t.id LIMIT 1);

-- Verify results
SELECT
  t.name AS team,
  t.primary_color,
  COUNT(p.id) AS players
FROM teams t
LEFT JOIN players p ON p.team_id = t.id
WHERE t.slug IN ('reapers', 'veterans', 'snipers', 'olympus')
GROUP BY t.id, t.name, t.primary_color
ORDER BY t.name;
