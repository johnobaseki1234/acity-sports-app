-- ACity Sports App — Football teams & rosters seed
-- Run ONCE in Supabase → SQL Editor. Safe to re-run (idempotent).
-- Jersey numbers are assigned in input order as placeholders; positions are
-- left blank for manual entry via the admin dashboard.

-- ============================================================
-- 0. PLAYER STATUS COLUMN  (active | retired | alumni)
-- ============================================================
alter table players add column if not exists status text not null default 'active';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'players_status_check') then
    alter table players
      add constraint players_status_check check (status in ('active', 'retired', 'alumni'));
  end if;
end $$;

create index if not exists idx_players_status on players(status);

-- ============================================================
-- 1. FOOTBALL TEAMS (6)
-- ============================================================
insert into teams (name, short_name, slug, primary_color, secondary_color) values
  ('Warriors', 'WAR', 'warriors', '#eab308', '#111827'),  -- yellow
  ('Falcons',  'FAL', 'falcons',  '#ffffff', '#1e3a5f'),  -- white
  ('Lions',    'LIO', 'lions',    '#16a34a', '#ffffff'),  -- green
  ('Elites',   'ELI', 'elites',   '#111827', '#ffffff'),  -- black
  ('Vikings',  'VIK', 'vikings',  '#dc2626', '#ffffff'),  -- red
  ('Dragons',  'DRA', 'dragons',  '#1e3a8a', '#ffffff')   -- dark blue
on conflict (slug) do nothing;

-- ============================================================
-- 2. FOOTBALL SEASON + TEAM LINKS
--    (needed so player profiles resolve the football sport)
-- ============================================================
insert into seasons (sport_id, name, start_date, end_date, is_active)
select s.id, 'ACFL Season 1', '2026-01-01', '2026-12-31', true
from sports s
where s.slug = 'football'
  and not exists (select 1 from seasons x where x.name = 'ACFL Season 1');

insert into season_teams (season_id, team_id)
select se.id, t.id
from seasons se
join teams t on t.slug in ('warriors', 'falcons', 'lions', 'elites', 'vikings', 'dragons')
where se.name = 'ACFL Season 1'
on conflict (season_id, team_id) do nothing;

-- ============================================================
-- 3. PLAYERS  (jersey = input order, position blank, status active)
-- ============================================================
with roster(slug, name, jersey) as (
  select 'warriors', trim(name), ord
    from unnest(array[
      'Madiba Ray','Bamba','Nana Kofi','Obeng','Malcom','Veve','Kuuchi','Rodney',
      'Prince Sadiq','Winston','Kofi Koranteng','Nana Brenya','Solid'
    ]::text[]) with ordinality as u(name, ord)
  union all
  select 'falcons', trim(name), ord
    from unnest(array[
      'Ojo(The Activist)','Chris','Leslie','Isaac','Ahuche','Marc-Oliver','Narh',
      'Nana Yaw','Fayad','Alex','Kwame Kessie'
    ]::text[]) with ordinality as u(name, ord)
  union all
  select 'lions', trim(name), ord
    from unnest(array[
      'Keli','Kwakye','Danny','Gaisie','Obaka','Shaun Benjamin','Kester','Jesse',
      'Wumpini','Mubarak','Nii Kpakpo','Kelvin','Robbie G','Selasie','Marouf'
    ]::text[]) with ordinality as u(name, ord)
  union all
  select 'elites', trim(name), ord
    from unnest(array[
      'David Add','Cheicks','CJ','Bob Mensah','Tonton','Abiks','Yasin','Stanley Ba',
      'Deji','Durmas','Quist Osm','Abeiku','Israel','Aaron','Abiks Jnr','Joshua Log'
    ]::text[]) with ordinality as u(name, ord)
  union all
  select 'vikings', trim(name), ord
    from unnest(array[
      'Kbam','Asare','Brookman','Stanley','Ankama Jnr','Papa Opoku','Alvin','Christophe',
      'Andy Hayi','Iseh','Manasseh','Jefferson','Ibrahim Sadiq','Sean'
    ]::text[]) with ordinality as u(name, ord)
  union all
  select 'dragons', trim(name), ord
    from unnest(array[
      'Ariel','Rhyndolf','Philippe','Freddie','Humphrey','Aaron','Theodore','Gerald',
      'Abdoul','Warren','Jamal','Twum','Wunthya','Thomas','Kumi','Setornam','Dominick','Senam'
    ]::text[]) with ordinality as u(name, ord)
)
insert into players (team_id, name, jersey_number, position)
select t.id, r.name, r.jersey, ''
from roster r
join teams t on t.slug = r.slug
where not exists (
  select 1 from players p where p.team_id = t.id and p.name = r.name
);
