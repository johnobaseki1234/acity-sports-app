# ACity Sports App — Session Brief
**Date:** 2026-06-17 (Session 4)
**Status:** Phase 3 complete, volleyball fully wired, initial git commit done

---

## What's Done

### App & Infrastructure
- Next.js 15 + TypeScript + Tailwind + Supabase fully wired up
- Running at `localhost:3000` with `npm run dev`
- Supabase project: `httelqyyrucbetlgopau.supabase.co`
- DB schema deployed (sports, seasons, teams, players, matches, match_events)
- **First git commit made** — all source files committed, `.env.local` stays out

### Data in Supabase
- 3 sports seeded: Football, Basketball, Volleyball
- ACBL Season 8 created and linked to all 4 basketball teams
- 57 basketball players with positions (7 still missing positions — update in Admin → Players)
- Andrew Amecks (Reapers) has secondary_position = 'PG' (primary = SG)
- Basketball standings config: 2pts win, 0 draw, 0 loss (run `acbl-basketball-standings-config.sql`)

### Pages & Features
- `/` — Homepage with live scoreboard + upcoming/recent matches
- `/sport/football` `/sport/basketball` `/sport/volleyball` — Sport-specific pages
- `/admin` — Admin dashboard (no auth for testing)
- `/admin/teams` — Lists all teams ✅
- `/admin/players` — Step-by-step wizard + secondary position field ✅
- `/admin/seasons` — Create/manage seasons ✅
- `/admin/matches` — Create/manage matches ✅
- `/scorer/[id]` — Live scoring console ✅
- `/match/[id]` — Public live match view with Realtime ✅
- `/standings/[sport]` — Standings table ✅
- `/fixtures/[sport]` — Fixtures list with filters ✅

### Volleyball — Fully Implemented (Session 4)
**Run `volleyball-fix.sql` in Supabase SQL Editor before starting any volleyball matches.**

Changes made:
- **DB trigger updated** — volleyball scoring events no longer auto-update home_score/away_score. Sets won are tracked manually per-set by the app
- **set_start event type added** to volleyball sport config
- **ScorerConsole** volleyball mode:
  - Main score = sets won (e.g., 2–1)
  - "Sets" label shown under main score
  - Live set score shown during active set (e.g., "Set 3: 18–14")
  - "End Set" button (instead of "End Period")
  - On set end: determines winner, increments sets-won count, stores per-set scores in home_sets/away_sets
  - Match ends automatically when team wins 3 sets OR set 5 completes
  - Set score history shown as breakdowns (S1 25–20 · S2 23–25 · …)
- **LiveMatchView** (public) updated:
  - Shows sets won as main score + "Sets" label
  - Shows live set score during active set
  - "By Set" breakdown replaces "By Quarter" for volleyball
- **MatchCard** badge: shows "Set Break" instead of "HT" during volleyball halftime

### Runtime Error Fixes (Session 4)
- `scorer/[id]/page.tsx` — `sport` is now null-guarded (returns 404 if match has no sport)
- `match/[id]/page.tsx` — same null guard for sport
- `ScorerConsole` volleyball `endPeriod` now correctly sets home_score/away_score as sets won
- Build passes clean — no TypeScript errors

---

## What's Pending

### Immediate Next Steps
1. **Run `volleyball-fix.sql`** in Supabase SQL Editor (DB trigger + event type fix)
2. **Set up football and volleyball leagues** in Admin → Seasons when ready
3. **7 basketball players still missing positions**: Sam Dave, Donald, Joshua Mishael, Wesley Turkson, Cheick Kader, Emmanuel Bonz, Emmanuel Abikoye — update in Admin → Players → Edit
4. Jersey numbers are sequential placeholders — update from live feed

### Before Production
- Re-enable auth on `/admin` and `/scorer`
- Set volleyball standings config after creating season (see `volleyball-fix.sql` bottom)
- Deploy to Vercel

---

## Phone Access (for fast roster entry)

**Step 1** — Start the dev server so it listens on the network:
```bash
npm run dev -- --hostname 0.0.0.0
```

**Step 2** — On your phone (same WiFi), open:
```
http://10.142.116.188:3000
```

The admin pages (`/admin/players`, `/admin/teams`) work on mobile — use them to add/edit players and fill in positions/jersey numbers directly from your phone while looking at the physical roster.

> **Note**: The IP `10.142.116.188` is your laptop's current WiFi IP. If it changes (e.g., you reconnect to a different network), run `ipconfig` in PowerShell and look for "IPv4 Address" to find the new one.

---

## Important Notes

### Key Files
- `supabase-schema.sql` — Full DB schema
- `volleyball-fix.sql` — **Run this before volleyball matches** (trigger fix + set_start event)
- `acbl-season8-seed.sql` — SQL that inserted all 4 basketball teams + 57 players
- `acbl-basketball-standings-config.sql` — Basketball standings config (2pts/win)
- `positions-update.sql` — Player positions
- `.env.local` — Supabase URL and anon key (NOT in git)

### Known Quirks
- Deleting `.next` while dev server runs breaks it — stop server first (`Ctrl+C`)
- Run `supabase-dev-access.sql` in Supabase SQL Editor if you get "permission denied" errors
- For phone access: use `--hostname 0.0.0.0` flag when starting dev server

### How to Resume
```bash
cd C:\Users\User\Documents\acity-sports-app
npm run dev
```
Then open `localhost:3000`. For phone access: `npm run dev -- --hostname 0.0.0.0`

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
    standings/[sport]/    ← Standings table
    fixtures/[sport]/     ← Fixtures list
  components/
    layout/Header.tsx     ← Sticky nav with sport pills
    admin/TeamForm.tsx    ← Team create/edit
    admin/PlayerForm.tsx  ← Step wizard + position + secondary_position
    admin/MatchForm.tsx   ← Match create/edit
    scorer/ScorerConsole.tsx ← Full scoring UI (basketball + football + volleyball)
    matches/LiveScoreboard.tsx ← Realtime live scores
    matches/LiveMatchView.tsx  ← Public match page (Realtime)
    matches/MatchCard.tsx      ← Match card (used on homepage + sport pages)
  lib/supabase/
    client.ts             ← Browser Supabase client
    server.ts             ← Server Supabase client (SSR)
    types.ts              ← All TypeScript types
  lib/utils/
    standings.ts          ← Standings computation
    periodScores.ts       ← Per-period score computation (basketball + volleyball)
    match.ts              ← Date/time formatting, status labels
```

**Volleyball scoring model:**
- `home_score`/`away_score` = **sets won** (updated by app on set end)
- `home_sets`/`away_sets` = arrays of point totals per set (e.g., [25, 23, 15])
- DB trigger bypassed for volleyball — app manages scores manually
- Match ends when team reaches 3 sets won, or after set 5

**Realtime flow:** Scorer logs event → DB trigger updates match score (non-volleyball) → Supabase Realtime pushes to all open browsers

---

## Phase Tracker

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1: Foundation | ✅ Complete | Scaffold, schema, admin CRUD, seed data |
| Phase 2: Live Scoring | ✅ Complete | Scorer panel, Realtime, live match page |
| Phase 3: Multi-Sport + Standings | ✅ Complete | Basketball scorer, standings, fixtures, volleyball |
| Phase 4: Profiles + Polish | ⏳ Future | Team/player pages, search, mobile polish |
| Phase 5: Notifications + PWA | ⏳ Future | Push notifications, PWA install |
