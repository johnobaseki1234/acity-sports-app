# ACity Sports App — Claude Session Brief (Phase 4 Completion)
**Date:** 2026-06-18
**Picked up from:** Codex (tokens exhausted mid-task) per `instructions.md`
**Status:** ✅ Phase 4 complete and verified. Phases 1–4 all done.

---

## What I Did This Session

### 1. Audited Codex's Phase 4 work (it was ~90% done and high quality)
Codex had already built, before running out of tokens:
- `/team/[slug]` — team profile (banner, brand-color gradient, roster, W/D/L record, fixtures + results)
- `/player/[id]` — player profile (on-the-fly stat aggregation + event log)
- `/search` — debounced global search (`.ilike`) across teams, players, venues
- `FollowButton` + `useFollowedTeams` localStorage hook
- `uploadImage.ts` wired into Team and Player admin forms
- `error.tsx` + `loading.tsx` boundaries for both dynamic routes
- Search link in the global `Header`
- Schema additions: storage buckets, `secondary_position` column, volleyball trigger bypass + `set_start` event

### 2. Fixed the one real gap — image uploads would have failed at runtime
Codex created the storage buckets but **not** the RLS policies on `storage.objects`.
Public buckets allow public *reads*, but anon *uploads* are blocked by default RLS.
→ Added **`supabase-storage-setup.sql`** with bucket creation + dev read/write/update/delete
policies scoped to `team-logos` and `player-photos`.

### 3. Restored a small polish regression
Codex had replaced the player-wizard emoji icons with plain text
(`✓`→`OK`, `← Back`→`Back`, sport emojis→text). Restored the nicer icons,
kept Codex's corrected per-sport team-count logic.

### 4. Verified everything
- `npm run build` → all **16 routes** prerender, no type/compile errors
- Dev smoke test (HTTP 200): `/`, `/search`, `/sport/basketball`, `/standings/basketball`,
  `/fixtures/basketball`, `/admin/teams/new`, `/admin/players/new`
- Dynamic routes with **real data**: `/team/reapers` 200, `/player/<real-id>` 200
  (stats section rendered), `/team/nonexistent` → not-found UI (correct)
- Committed as `8063123` "Phase 4 complete — profiles, search, follow, image uploads"

> Note: An earlier batch test showed transient 500s — that was first-hit dev
> compilation of 7 routes at once under a tight timeout, NOT a real bug. Sequential
> testing with proper timeouts returned 200 across the board, and the production
> build prerenders all routes (which would fail if any page genuinely crashed).

---

## ⚠️ ACTION REQUIRED BEFORE IMAGE UPLOADS / VOLLEYBALL WORK

Run these in **Supabase → SQL Editor** (one time each):

1. **`supabase-storage-setup.sql`** — creates image buckets + upload policies.
   Without this, logo/photo uploads in the admin forms fail with
   "new row violates row-level security policy."
2. **`volleyball-fix.sql`** — volleyball set-scoring trigger fix (if not already run).
   (Codex also folded these changes into `supabase-schema.sql` for fresh installs.)

---

## Phase Tracker

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1: Foundation | ✅ Complete | Scaffold, schema, admin CRUD, seed data |
| Phase 2: Live Scoring | ✅ Complete | Scorer panel, Realtime, live match page |
| Phase 3: Multi-Sport + Standings | ✅ Complete | Basketball + volleyball scorer, standings, fixtures |
| Phase 4: Profiles + Polish | ✅ Complete | Team/player profiles, search, follow, image uploads, boundaries |
| Phase 5: Notifications + PWA | ⏳ Future | Push notifications, PWA install/manifest |
| Phase 6 | ⏳ Future | (Your call — define scope) |

---

## Phase 4 Feature Reference (where things live)

| Feature | File |
|---------|------|
| Team profile | `src/app/team/[slug]/page.tsx` (+ `error.tsx`, `loading.tsx`) |
| Player profile | `src/app/player/[id]/page.tsx` (+ `error.tsx`, `loading.tsx`) |
| Global search | `src/app/search/page.tsx` |
| Follow button | `src/components/ui/FollowButton.tsx` |
| Follow storage hook | `src/hooks/useFollowedTeams.ts` |
| Image upload helper | `src/lib/storage/uploadImage.ts` |
| Search link in nav | `src/components/layout/Header.tsx` |
| Upload in forms | `src/components/admin/TeamForm.tsx`, `PlayerForm.tsx` |

---

## Still Pending (carried over, not blocking)

- 7 basketball players missing positions: Sam Dave, Donald, Joshua Mishael,
  Wesley Turkson, Cheick Kader, Emmanuel Bonz, Emmanuel Abikoye (Admin → Players → Edit)
- Jersey numbers are sequential placeholders — update from live feed
- Football & volleyball leagues not yet created (Admin → Seasons)

### Before production
- Re-enable auth on `/admin` and `/scorer`
- Run cleanup blocks in `supabase-dev-access.sql` and `supabase-storage-setup.sql`
- Deploy to Vercel

---

## How to Resume
```powershell
cd C:\Users\User\Documents\acity-sports-app
npm run dev
```
For phone access (roster entry): `npm run dev -- --hostname 0.0.0.0` then open
`http://<your-laptop-ip>:3000/admin` on your phone (same WiFi). Run `ipconfig` for the IP.

---

## Note on Phases 5–6
You mentioned you'll attempt phases 5–6 manually, then have me verify and continue.
When ready, just point me at the work and I'll audit it the same way I did Phase 4:
read every new/changed file, build, smoke-test routes, fix gaps, commit.
