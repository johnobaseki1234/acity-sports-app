# ACity Sports App — Session Brief
**Date:** 2026-06-16 (Session 2)
**Status:** Positions updated, secondary_position added, ready for Phase 3

---

## What's Done

### App & Infrastructure
- Next.js 15 + TypeScript + Tailwind + Supabase fully wired up
- Running at `localhost:3000` with `npm run dev`
- Supabase project: `httelqyyrucbetlgopau.supabase.co`
- `.env.local` has real anon key (filled in and working)
- DB schema deployed (sports, seasons, teams, players, matches, match_events)

### Data in Supabase
- 3 sports seeded: Football, Basketball, Volleyball
- ACBL Season 8 created and linked to all 4 teams
- 4 basketball teams: Reapers (red), Veterans (black), Snipers (cyan), Olympus (orange)
- 57 players with real positions now loaded (see below)
- `secondary_position` column added to players table
- Andrew Amecks (Reapers) has secondary_position = 'PG' (primary = SG)

### Player Positions Summary

| Team | Players | Notable |
|------|---------|---------|
| Reapers (14) | Jeremy PF, Jesse C, Cornelius PG, Alvin PG, Bill Gates SG, Lincoln SG, Ebere PF, CJ C, Andrew Amecks SG/PG, King David SF, Malvin C, Kelvin Lartey PF, Shemuel PF | Sam Dave — no position |
| Veterans (16) | Rayan PG, Jonathan PG, Benji PG, Jesper C, Adrian PG, Andrew PF, Rodney C, Oheneba Amissa PG, Lawer SF, Alex SG, Maxime PG, Nana Kwadwo C, Stybo PF, Mawuli SG, Tobi C | Donald — no position |
| Snipers (11) | David Obaseki SF, KK PF, John Obaseki C, George PG, Kissi Asare PF, Samuel Boateng SF, Joshua Mishael (no pos), Aaron SG, Malcom Ashun PF, Ishmael PG, Kofi SG | Joshua Mishael — no position |
| Olympus (16) | Robert Owoo SG, Latif SG, Evan Guy-Samuel C, Warren Esonu SF, Damiba Yohan PF, Steven Okrah PF, William Gyampe C, Daniel Thomas PF, Stephen Adams SG, Manuel Balinga PG, Lionel Hunlede SG, phillipe C | Wesley Turkson, Cheick Kader, Emmanuel Bonz, Emmanuel Abikoye — no position |

### Code Changes This Session
- `positions-update.sql` — SQL to add secondary_position column + update all 57 player positions (run this in Supabase SQL Editor if not done yet)
- `src/lib/supabase/types.ts` — Player type now includes `secondary_position: string | null`
- `src/components/admin/PlayerForm.tsx` — Secondary Position field added to both edit mode and create wizard

### Pages & Features
- `/` — Homepage with live scoreboard + upcoming/recent matches
- `/sport/football` `/sport/basketball` `/sport/volleyball` — Sport-specific pages
- `/admin` — Admin dashboard (no auth for testing)
- `/admin/teams` — Lists all teams ✅
- `/admin/players` — Step-by-step wizard + secondary position field
- `/admin/seasons` — Create/manage seasons
- `/admin/matches` — Create/manage matches
- `/scorer/[id]` — Live scoring console (no auth for testing)
- `/match/[id]` — Public live match view with Realtime

---

## What's Pending

### Immediate Next Steps (Phase 3)
1. **Schedule a basketball match** — Admin → Matches → New Match → ACBL Season 8, two teams, set date/time. This makes the homepage and basketball page show real content.
2. **Basketball scorer panel** — Sport-specific event buttons (2pt, 3pt, FT, quarters) instead of the current football-oriented scorer
3. **Standings page** (`/standings/basketball`) — League table with W/L/points
4. **Fixtures page** (`/fixtures/basketball`) — Full schedule with filters

### Still Needed for Data
- Jersey numbers (user will update from the live feed when matches start)
- Positions for: Sam Dave, Donald, Joshua Mishael, Wesley Turkson, Cheick Kader, Emmanuel Bonz, Emmanuel Abikoye (7 players with no position — update via Admin → Players → Edit)

### Before Production
- Re-enable auth on `/admin` and `/scorer`
- Set up football and volleyball leagues when ready
- Deploy to Vercel

---

## Important Notes

### Key Files
- `supabase-schema.sql` — Full DB schema
- `acbl-season8-seed.sql` — SQL that inserted all 4 teams + 57 players
- `positions-update.sql` — Run this to load player positions + secondary_position column
- `.env.local` — Supabase URL and anon key (DO NOT commit to git)

### Known Quirks
- Deleting `.next` while dev server runs breaks it — stop server first (`Ctrl+C`)
- Run `supabase-dev-access.sql` in Supabase SQL Editor if you get "permission denied for table …" errors
- Re-run that file if you ever reset the DB schema
- Admin write operations require authenticated role — SQL editor bypasses this

### How to Resume
```bash
cd C:\Users\User\Documents\acity-sports-app
npm run dev
```
Then open `localhost:3000`.

---

## Architecture Summary

```
src/
  app/
    page.tsx              ← Homepage
    sport/[slug]/page.tsx ← Per-sport pages
    admin/                ← Admin CRUD (teams, players, seasons, matches)
    scorer/[id]/          ← Live scoring console
    match/[id]/           ← Public match view
  components/
    layout/Header.tsx     ← Sticky nav with sport pills
    admin/TeamForm.tsx    ← Team create/edit
    admin/PlayerForm.tsx  ← Step wizard + position + secondary_position
    scorer/ScorerConsole.tsx ← Full scoring UI
    matches/LiveScoreboard.tsx ← Realtime live scores
  lib/supabase/
    client.ts             ← Browser Supabase client
    server.ts             ← Server Supabase client (SSR)
    types.ts              ← All TypeScript types (Player now has secondary_position)
```

**Realtime flow:** Scorer logs event → DB trigger updates match score → Supabase Realtime pushes to all open browsers

---

## Phase Tracker

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1: Foundation | ✅ Complete | Scaffold, schema, admin CRUD, seed data |
| Phase 2: Live Scoring | ✅ Complete | Scorer panel, Realtime, live match page |
| Phase 3: Multi-Sport + Standings | 🔄 Next | Basketball scorer variant, standings, fixtures |
| Phase 4: Profiles + Polish | ⏳ Future | Team/player pages, search, mobile polish |
| Phase 5: Notifications + PWA | ⏳ Future | Push notifications, PWA install |
