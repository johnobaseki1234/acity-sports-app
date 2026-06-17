-- ============================================================
-- ACBL Season 8 — Player Positions Update
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add secondary_position column
ALTER TABLE players ADD COLUMN IF NOT EXISTS secondary_position text;

-- 2. Update all positions
-- REAPERS
UPDATE players SET position = 'PF'  WHERE name = 'Jeremy'        AND team_id = (SELECT id FROM teams WHERE slug = 'reapers');
UPDATE players SET position = NULL  WHERE name = 'Sam Dave'      AND team_id = (SELECT id FROM teams WHERE slug = 'reapers');
UPDATE players SET position = 'C'   WHERE name = 'Jesse'         AND team_id = (SELECT id FROM teams WHERE slug = 'reapers');
UPDATE players SET position = 'PG'  WHERE name = 'Cornelius'     AND team_id = (SELECT id FROM teams WHERE slug = 'reapers');
UPDATE players SET position = 'PG'  WHERE name = 'Alvin'         AND team_id = (SELECT id FROM teams WHERE slug = 'reapers');
UPDATE players SET position = 'SG'  WHERE name = 'Bill Gates'    AND team_id = (SELECT id FROM teams WHERE slug = 'reapers');
UPDATE players SET position = 'SG'  WHERE name = 'Lincoln'       AND team_id = (SELECT id FROM teams WHERE slug = 'reapers');
UPDATE players SET position = 'PF'  WHERE name = 'Ebere'         AND team_id = (SELECT id FROM teams WHERE slug = 'reapers');
UPDATE players SET position = 'C'   WHERE name = 'CJ'            AND team_id = (SELECT id FROM teams WHERE slug = 'reapers');
UPDATE players SET position = 'SG', secondary_position = 'PG' WHERE name = 'Andrew Amecks' AND team_id = (SELECT id FROM teams WHERE slug = 'reapers');
UPDATE players SET position = 'SF'  WHERE name = 'King David'    AND team_id = (SELECT id FROM teams WHERE slug = 'reapers');
UPDATE players SET position = 'C'   WHERE name = 'Malvin'        AND team_id = (SELECT id FROM teams WHERE slug = 'reapers');
UPDATE players SET position = 'PF'  WHERE name = 'Kelvin Lartey' AND team_id = (SELECT id FROM teams WHERE slug = 'reapers');
UPDATE players SET position = 'PF'  WHERE name = 'Shemuel'       AND team_id = (SELECT id FROM teams WHERE slug = 'reapers');

-- VETERANS
UPDATE players SET position = 'PG'  WHERE name = 'Rayan'          AND team_id = (SELECT id FROM teams WHERE slug = 'veterans');
UPDATE players SET position = 'PG'  WHERE name = 'Jonathan'       AND team_id = (SELECT id FROM teams WHERE slug = 'veterans');
UPDATE players SET position = NULL  WHERE name = 'Donald'         AND team_id = (SELECT id FROM teams WHERE slug = 'veterans');
UPDATE players SET position = 'PG'  WHERE name = 'Benji'          AND team_id = (SELECT id FROM teams WHERE slug = 'veterans');
UPDATE players SET position = 'C'   WHERE name = 'Jesper'         AND team_id = (SELECT id FROM teams WHERE slug = 'veterans');
UPDATE players SET position = 'PG'  WHERE name = 'Adrian'         AND team_id = (SELECT id FROM teams WHERE slug = 'veterans');
UPDATE players SET position = 'PF'  WHERE name = 'Andrew'         AND team_id = (SELECT id FROM teams WHERE slug = 'veterans');
UPDATE players SET position = 'C'   WHERE name = 'Rodney'         AND team_id = (SELECT id FROM teams WHERE slug = 'veterans');
UPDATE players SET position = 'PG'  WHERE name = 'Oheneba Amissa' AND team_id = (SELECT id FROM teams WHERE slug = 'veterans');
UPDATE players SET position = 'SF'  WHERE name = 'Lawer'          AND team_id = (SELECT id FROM teams WHERE slug = 'veterans');
UPDATE players SET position = 'SG'  WHERE name = 'Alex'           AND team_id = (SELECT id FROM teams WHERE slug = 'veterans');
UPDATE players SET position = 'PG'  WHERE name = 'Maxime'         AND team_id = (SELECT id FROM teams WHERE slug = 'veterans');
UPDATE players SET position = 'C'   WHERE name = 'Nana Kwadwo'    AND team_id = (SELECT id FROM teams WHERE slug = 'veterans');
UPDATE players SET position = 'PF'  WHERE name = 'Stybo'          AND team_id = (SELECT id FROM teams WHERE slug = 'veterans');
UPDATE players SET position = 'SG'  WHERE name = 'Mawuli'         AND team_id = (SELECT id FROM teams WHERE slug = 'veterans');
UPDATE players SET position = 'C'   WHERE name = 'Tobi'           AND team_id = (SELECT id FROM teams WHERE slug = 'veterans');

-- SNIPERS
UPDATE players SET position = 'SF'  WHERE name = 'David Obaseki'  AND team_id = (SELECT id FROM teams WHERE slug = 'snipers');
UPDATE players SET position = 'PF'  WHERE name = 'KK'             AND team_id = (SELECT id FROM teams WHERE slug = 'snipers');
UPDATE players SET position = 'C'   WHERE name = 'John Obaseki'   AND team_id = (SELECT id FROM teams WHERE slug = 'snipers');
UPDATE players SET position = 'PG'  WHERE name = 'George'         AND team_id = (SELECT id FROM teams WHERE slug = 'snipers');
UPDATE players SET position = 'PF'  WHERE name = 'Kissi Asare'    AND team_id = (SELECT id FROM teams WHERE slug = 'snipers');
UPDATE players SET position = 'SF'  WHERE name = 'Samuel Boateng' AND team_id = (SELECT id FROM teams WHERE slug = 'snipers');
UPDATE players SET position = NULL  WHERE name = 'Joshua Mishael'  AND team_id = (SELECT id FROM teams WHERE slug = 'snipers');
UPDATE players SET position = 'SG'  WHERE name = 'Aaron'          AND team_id = (SELECT id FROM teams WHERE slug = 'snipers');
UPDATE players SET position = 'PF'  WHERE name = 'Malcom Ashun'   AND team_id = (SELECT id FROM teams WHERE slug = 'snipers');
UPDATE players SET position = 'PG'  WHERE name = 'Ishmael'        AND team_id = (SELECT id FROM teams WHERE slug = 'snipers');
UPDATE players SET position = 'SG'  WHERE name = 'Kofi'           AND team_id = (SELECT id FROM teams WHERE slug = 'snipers');

-- OLYMPUS
UPDATE players SET position = NULL  WHERE name = 'Wesley Turkson'    AND team_id = (SELECT id FROM teams WHERE slug = 'olympus');
UPDATE players SET position = 'SG'  WHERE name = 'Robert Owoo'       AND team_id = (SELECT id FROM teams WHERE slug = 'olympus');
UPDATE players SET position = NULL  WHERE name = 'Cheick Kader'      AND team_id = (SELECT id FROM teams WHERE slug = 'olympus');
UPDATE players SET position = 'SG'  WHERE name = 'Latif'             AND team_id = (SELECT id FROM teams WHERE slug = 'olympus');
UPDATE players SET position = NULL  WHERE name = 'Emmanuel Bonz'     AND team_id = (SELECT id FROM teams WHERE slug = 'olympus');
UPDATE players SET position = 'C'   WHERE name = 'Evan Guy-Samuel'   AND team_id = (SELECT id FROM teams WHERE slug = 'olympus');
UPDATE players SET position = 'SF'  WHERE name = 'Warren Esonu'      AND team_id = (SELECT id FROM teams WHERE slug = 'olympus');
UPDATE players SET position = 'PF'  WHERE name = 'Damiba Yohan'      AND team_id = (SELECT id FROM teams WHERE slug = 'olympus');
UPDATE players SET position = 'PF'  WHERE name = 'Steven Okrah'      AND team_id = (SELECT id FROM teams WHERE slug = 'olympus');
UPDATE players SET position = 'C'   WHERE name = 'William Gyampe'    AND team_id = (SELECT id FROM teams WHERE slug = 'olympus');
UPDATE players SET position = 'PF'  WHERE name = 'Daniel Thomas'     AND team_id = (SELECT id FROM teams WHERE slug = 'olympus');
UPDATE players SET position = 'SG'  WHERE name = 'Stephen Adams'     AND team_id = (SELECT id FROM teams WHERE slug = 'olympus');
UPDATE players SET position = 'PG'  WHERE name = 'Manuel Balinga'    AND team_id = (SELECT id FROM teams WHERE slug = 'olympus');
UPDATE players SET position = 'SG'  WHERE name = 'Lionel Hunlede'    AND team_id = (SELECT id FROM teams WHERE slug = 'olympus');
UPDATE players SET position = 'C'   WHERE name = 'phillipe'          AND team_id = (SELECT id FROM teams WHERE slug = 'olympus');
UPDATE players SET position = NULL  WHERE name = 'Emmanuel Abikoye'  AND team_id = (SELECT id FROM teams WHERE slug = 'olympus');

-- Verify
SELECT t.name AS team, p.name, p.position, p.secondary_position
FROM players p JOIN teams t ON t.id = p.team_id
WHERE t.slug IN ('reapers','veterans','snipers','olympus')
ORDER BY t.name, p.name;
