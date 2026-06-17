# ACity Sports App — Architecture & Project Breakdown

> Live match tracker for ACity school football, basketball, and volleyball leagues.
> Public-facing scores and standings, with a courtside scorer interface for real-time input.

---

## 1. Scope & Vision

**What it is:** A real-time sports platform for Academic City University College leagues. Fans can follow live scores, read play-by-play feeds, browse team/player profiles, and view league standings — all without creating an account. An authorized scorer inputs live match events from a phone/tablet courtside.

**What it is NOT (at launch):** A social platform, a betting app, a full stats analytics suite, or a multi-school network. Those can come later.

**Reference app:** "Real - Sports" (live scores, play-by-play feeds, follow teams/players, multi-sport support). We borrow the UX patterns — live match cards, event timelines, team pages — but scope them for a single campus with three sports.

---

## 2. Core Features

### 2.1 Public Features (No Login Required)

| Feature | Description |
|---------|-------------|
| **Live Match Dashboard** | Homepage showing all live, upcoming, and recent matches across all sports. Live matches show real-time scores with auto-updating UI. |
| **Live Match View** | Full match detail page: live score, game clock/period, play-by-play event feed (goals, fouls, timeouts, substitutions), team lineups. |
| **Play-by-Play Feed** | Chronological event stream for each match. Events render differently by type (goal = highlight, foul = warning, substitution = neutral). Scrolls live as events arrive. |
| **Team Profiles** | Team page with roster, current season record, upcoming fixtures, recent results, and team photo/logo. |
| **Player Profiles** | Player page with photo, position, jersey number, team, and season stats summary (goals, assists, points, etc. depending on sport). |
| **League Standings** | Live-updated league tables per sport/season. Points, wins, draws, losses, goal/point difference. Sortable columns. |
| **Fixtures & Results** | Full schedule view per sport. Filter by team, date range, or matchday. Past games show final scores; future games show date/time/venue. |
| **Sport Switcher** | Persistent nav element to switch between Football, Basketball, and Volleyball contexts. |
| **Search** | Find teams, players, or matches by name. |

### 2.2 Notifications & Following

| Feature | Description |
|---------|-------------|
| **Follow Teams** | Users can follow teams (stored in localStorage, no account needed). Followed teams surface at the top of the dashboard. |
| **Push Notifications** | Browser push notifications for followed teams: match start, goals/key events, final score. Requires one-time permission grant, no account. |
| **Match Reminders** | Opt in to a reminder N minutes before a followed team's match. |

### 2.3 Scorer Interface (Authenticated)

| Feature | Description |
|---------|-------------|
| **Scorer Login** | Simple auth (Supabase email/password). One scorer account per game, assigned by admin. |
| **Live Scoring Panel** | Mobile-optimized touch interface for inputting events during a match. Large tap targets for quick input. Sport-specific event buttons (see 2.4). |
| **Game Clock Control** | Start/pause/resume/end period buttons. Clock syncs to all viewers via Supabase Realtime. |
| **Event Input** | Tap to log: who did what, at what time. Auto-suggests player names from the roster. Undo last event button for quick corrections. |
| **Halftime / Period Breaks** | One-tap period transition. Auto-pauses clock, transitions UI. |
| **End Match** | Finalize match, lock further input, publish final score. |

### 2.4 Sport-Specific Events

| Football (Soccer) | Basketball | Volleyball |
|-------------------|------------|------------|
| Goal | 2-Point FG | Point (rally) |
| Assist | 3-Point FG | Ace |
| Yellow Card | Free Throw (made/missed) | Block |
| Red Card | Rebound | Kill |
| Substitution | Assist | Service Error |
| Foul | Steal | Substitution |
| Corner / Free Kick | Block | Timeout |
| Penalty (scored/missed) | Turnover | Set win |
| Offside | Foul | Challenge |
| Half start/end | Timeout | — |
| — | Quarter start/end | — |

### 2.5 Admin Interface (Authenticated)

| Feature | Description |
|---------|-------------|
| **Admin Login** | Supabase auth with admin role flag. |
| **Manage Teams** | CRUD for teams: name, logo, sport, roster management. |
| **Manage Players** | CRUD for players: name, photo, jersey number, position, team assignment. |
| **Manage Seasons** | Create seasons/leagues, set start/end dates, assign teams. |
| **Schedule Matches** | Create fixtures: teams, date/time, venue, assigned scorer. |
| **Assign Scorers** | Grant scorer access for specific matches to specific user accounts. |
| **Edit Match Events** | Post-hoc correction of any match event (fix a wrong goal attribution, etc.). |
| **Announcements** | Post news/announcements visible on the app homepage. |

---

## 3. Tech Stack

### 3.1 Overview

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Next.js 15 (App Router) | Component-based UI, SSR for SEO on standings/team pages, API routes for server logic, file-based routing for clean URL structure. |
| **Language** | TypeScript | Type safety across data models, Supabase types auto-generated. |
| **Database** | Supabase (PostgreSQL) | Hosted Postgres with built-in Realtime, Auth, Row Level Security. Proven in acitymarket. |
| **Realtime** | Supabase Realtime (WebSockets) | Instant score/event push to all connected viewers. Channel-per-match architecture. |
| **Auth** | Supabase Auth | Email/password for scorers and admins. No auth required for public viewers. |
| **Styling** | Tailwind CSS | Utility-first, fast to build responsive mobile-first UI. Good component patterns for sport cards, event feeds, tables. |
| **Deployment** | Vercel | Seamless Next.js hosting, edge functions, preview deployments. Consistent with acitymarket on Vercel. |
| **Push Notifications** | Web Push API + Supabase Edge Functions | Browser-native push via service worker. Edge function triggers on match events for followed teams. |
| **Image Storage** | Supabase Storage | Team logos, player photos. Public bucket with CDN. |
| **Type Generation** | Supabase CLI (`supabase gen types`) | Auto-generate TypeScript types from DB schema. Single source of truth. |

### 3.2 Key Architecture Decisions

**Why Next.js over vanilla JS (like acitymarket):**
The sports app is significantly more complex — multiple sport types each with different event schemas, real-time feeds with different render strategies, admin CRUD panels, and SEO-relevant pages (standings, team profiles). A component model with TypeScript keeps this manageable. acitymarket works well as vanilla JS because it's a single-domain marketplace; this app has more moving parts.

**Why Supabase Realtime (not Socket.io / Pusher / Firebase):**
- Already proven in acitymarket — team familiarity.
- Realtime is built into the same platform as the database, auth, and storage — one vendor, one SDK.
- Channel-per-match model maps naturally to Postgres changes: subscribe to `match_events` where `match_id = X`.
- Supabase Realtime supports Postgres Changes (row-level) and Broadcast (lightweight, no DB write needed for clock ticks).

**Realtime architecture — two channel types per match:**

1. **Postgres Changes channel** — subscribes to `match_events` INSERT for the match. Every goal, foul, substitution is a DB row, so it persists and replays for late joiners. ~1-30 events per match.
2. **Broadcast channel** — used for ephemeral state like game clock ticks (every second during play). Not persisted to DB. Clock state (running/paused, current time) is stored in `matches` table and synced on pause/resume; ticks are broadcast-only.

**Why not a native mobile app:**
PWA gives 90% of the experience (home screen install, push notifications, offline shell) with 100% web deployment. ACity students already use phones for acitymarket as a PWA. If native is needed later, the Next.js API layer is already the backend.

---

## 4. Data Model

### 4.1 Entity Relationship Diagram (Conceptual)

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  sports   │────<│  seasons  │────<│season_teams│──── teams
└──────────┘     └──────────┘     └──────────┘
                                                      │
                                        ┌─────────────┤
                                        │             │
                                   ┌────┴─────┐ ┌────┴─────┐
                                   │ players   │ │ matches   │
                                   └──────────┘ └──────────┘
                                                      │
                                                 ┌────┴─────┐
                                                 │match_events│
                                                 └──────────┘
```

### 4.2 Table Definitions

#### `sports`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | "Football", "Basketball", "Volleyball" |
| slug | text UNIQUE | "football", "basketball", "volleyball" |
| icon | text | Emoji or icon identifier |
| event_types | jsonb | Array of valid event type definitions for this sport (see 2.4) |
| scoring_rules | jsonb | How to calculate points from events (e.g., basketball: 2pt/3pt/FT values) |
| periods | jsonb | Period structure: `{ count: 2, name: "Half", duration_minutes: 45 }` for football |
| created_at | timestamptz | |

#### `seasons`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| sport_id | uuid FK -> sports | |
| name | text | "2025/26 Season", "Inter-Hall League 2026" |
| start_date | date | |
| end_date | date | |
| is_active | boolean | Only one active season per sport |
| standings_config | jsonb | Points per win/draw/loss, tiebreaker rules |
| created_at | timestamptz | |

#### `teams`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | "Hall A Lions" |
| short_name | text | "Lions" — for scoreboards |
| slug | text UNIQUE | URL-friendly name |
| logo_url | text | Supabase Storage URL |
| primary_color | text | Hex code for UI theming |
| secondary_color | text | Hex code |
| created_at | timestamptz | |

#### `season_teams` (join table)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| season_id | uuid FK -> seasons | |
| team_id | uuid FK -> teams | |
| group_name | text NULLABLE | For group-stage leagues |
| UNIQUE | (season_id, team_id) | |

#### `players`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| team_id | uuid FK -> teams | |
| name | text | |
| jersey_number | int | |
| position | text | Sport-specific: "GK", "PG", "Setter", etc. |
| photo_url | text NULLABLE | |
| is_active | boolean | Soft delete / inactive toggle |
| created_at | timestamptz | |

#### `matches`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| season_id | uuid FK -> seasons | |
| home_team_id | uuid FK -> teams | |
| away_team_id | uuid FK -> teams | |
| scheduled_at | timestamptz | Planned start time |
| venue | text | "Main Pitch", "Indoor Court" |
| status | enum | `scheduled`, `live`, `halftime`, `finished`, `postponed`, `cancelled` |
| current_period | int | Which half/quarter/set we're in |
| period_start_time | timestamptz NULLABLE | When current period clock started (for computing elapsed time) |
| clock_running | boolean DEFAULT false | Is the game clock currently ticking? |
| home_score | int DEFAULT 0 | Denormalized for fast reads |
| away_score | int DEFAULT 0 | Denormalized for fast reads |
| home_sets | int[] NULLABLE | Volleyball: scores per set, e.g. `[25, 23, 25]` |
| away_sets | int[] NULLABLE | Volleyball: scores per set |
| scorer_id | uuid FK -> auth.users NULLABLE | Assigned scorer for this match |
| matchday | int NULLABLE | League matchday number |
| started_at | timestamptz NULLABLE | Actual start time |
| finished_at | timestamptz NULLABLE | Actual end time |
| created_at | timestamptz | |

#### `match_events`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| match_id | uuid FK -> matches | |
| event_type | text | "goal", "yellow_card", "3pt_made", "ace", etc. |
| team_id | uuid FK -> teams | Which team the event belongs to |
| player_id | uuid FK -> players NULLABLE | Player involved (nullable for team-level events like timeout) |
| assist_player_id | uuid FK -> players NULLABLE | Secondary player (assist on a goal, etc.) |
| period | int | Which period this happened in |
| match_minute | int NULLABLE | Game minute (football) or null for clock-stop sports |
| details | jsonb NULLABLE | Extra data: `{ "penalty": true }`, `{ "own_goal": true }` |
| created_at | timestamptz | Server timestamp — ordering tiebreaker |
| created_by | uuid FK -> auth.users | Scorer who logged this |

#### `standings` (materialized view or computed)
| Column | Type | Notes |
|--------|------|-------|
| season_id | uuid | |
| team_id | uuid | |
| played | int | |
| won | int | |
| drawn | int | |
| lost | int | |
| goals_for / points_for | int | Sport-appropriate |
| goals_against / points_against | int | |
| goal_difference / point_difference | int | |
| points | int | League points (W=3, D=1, L=0 for football, etc.) |

> Standings can be computed via a Postgres view joining `matches` (status = finished) with `match_events`, or maintained as a materialized view refreshed on match completion. A view is simpler; materialize only if performance becomes an issue.

#### `announcements`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| title | text | |
| body | text | Markdown or plain text |
| sport_id | uuid FK -> sports NULLABLE | Null = all sports |
| is_pinned | boolean DEFAULT false | |
| created_at | timestamptz | |
| created_by | uuid FK -> auth.users | |

#### `push_subscriptions`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| endpoint | text | Web Push endpoint URL |
| keys | jsonb | `{ p256dh, auth }` — Web Push keys |
| followed_team_ids | uuid[] | Teams this subscription follows |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `profiles` (extends Supabase auth.users)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK FK -> auth.users | |
| role | enum | `admin`, `scorer` |
| display_name | text | |
| created_at | timestamptz | |

### 4.3 Row Level Security (RLS) Strategy

| Table | Public (anon) | Scorer | Admin |
|-------|--------------|--------|-------|
| sports | SELECT | SELECT | ALL |
| seasons | SELECT | SELECT | ALL |
| teams | SELECT | SELECT | ALL |
| players | SELECT | SELECT | ALL |
| matches | SELECT | UPDATE (assigned only) | ALL |
| match_events | SELECT | INSERT/UPDATE (assigned) | ALL |
| announcements | SELECT | — | ALL |
| push_subscriptions | INSERT own | — | SELECT |
| profiles | — | SELECT own | ALL |

---

## 5. Pages & Screens

### 5.1 Public Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | **Home / Dashboard** | Live matches at top (auto-updating cards), upcoming matches, recent results. Sport filter tabs. Announcements banner. |
| `/football` | **Sport Home** | Football-specific: live matches, standings snapshot, next fixtures, top scorers. Same pattern for `/basketball`, `/volleyball`. |
| `/match/[id]` | **Live Match** | The core page. Live score header, game clock, play-by-play event timeline, lineups tab, stats tab. Realtime-connected. |
| `/standings/[sport]` | **Standings** | Full league table for the active season. Expandable rows for form guide (W/D/L last 5). |
| `/fixtures/[sport]` | **Fixtures & Results** | Calendar/list view of all matches. Filter by team, matchday, date range. |
| `/team/[slug]` | **Team Profile** | Logo, colors, roster list, season record, upcoming fixtures, recent results. |
| `/player/[id]` | **Player Profile** | Photo, team, position, jersey #, season stats, recent match appearances. |
| `/search` | **Search** | Search teams, players, matches by keyword. |

### 5.2 Scorer Pages (Authenticated)

| Route | Page | Description |
|-------|------|-------------|
| `/scorer/login` | **Scorer Login** | Email/password login. Redirects to assigned match. |
| `/scorer/match/[id]` | **Live Scoring Panel** | Mobile-optimized scoring interface. Large buttons for event input. Game clock controls. Undo last event. Sport-specific layout. |

### 5.3 Admin Pages (Authenticated)

| Route | Page | Description |
|-------|------|-------------|
| `/admin/login` | **Admin Login** | |
| `/admin` | **Admin Dashboard** | Overview: live matches, recent activity, quick links. |
| `/admin/teams` | **Manage Teams** | List, create, edit, delete teams. Assign to seasons. |
| `/admin/players` | **Manage Players** | List, create, edit players. Assign to teams. Photo upload. |
| `/admin/seasons` | **Manage Seasons** | Create seasons, set rules, assign teams. |
| `/admin/matches` | **Manage Fixtures** | Schedule matches, assign scorers, edit past match events. |
| `/admin/announcements` | **Announcements** | Create/edit/delete announcements. |
| `/admin/scorers` | **Manage Scorers** | Create scorer accounts, view assignment history. |

### 5.4 Wireframe Concepts

**Live Match Card (Dashboard)**
```
┌─────────────────────────────────┐
│  LIVE               Football    │
│                                 │
│  Hall A Lions    2 - 1    Elite │
│  G 34' Kofi A.          G 12'  │
│  G 41' Ama S.                   │
│                                 │
│  56:23    2nd Half              │
└─────────────────────────────────┘
```

**Scorer Panel (Football)**
```
┌─────────────────────────────────┐
│  Lions 2 - 1 Elite    56:23    │
│  [Resume] [Pause] [End Half]    │
├─────────────────────────────────┤
│  HOME (Lions)    │  AWAY (Elite)│
│  [Goal]          │  [Goal]      │
│  [Yellow Card]   │  [Yellow]    │
│  [Red Card]      │  [Red]       │
│  [Substitution]  │  [Sub]       │
│  [Corner]        │  [Corner]    │
│  [Foul]          │  [Foul]      │
├─────────────────────────────────┤
│  [Undo Last: Goal Kofi A. 41'] │
├─────────────────────────────────┤
│  Event Log:                      │
│  41' G Kofi A. (assist: Yaw)   │
│  34' G Ama S.                   │
│  12' G Elite — Ben K.           │
└─────────────────────────────────┘
```

---

## 6. Realtime Architecture Detail

### 6.1 Channel Design

```
Per-match channels (created when match goes live):

Channel: match:{match_id}:events
  Type: Postgres Changes (INSERT on match_events WHERE match_id = X)
  Purpose: New events (goals, fouls, etc.) push to all viewers
  Consumers: Live Match page, Dashboard match cards

Channel: match:{match_id}:clock
  Type: Broadcast
  Purpose: Ephemeral clock ticks (every 1s when running), clock state changes
  Payload: { elapsed_seconds, period, running }
  Consumers: Live Match page, Dashboard match cards, Scorer panel

Channel: match:{match_id}:score
  Type: Postgres Changes (UPDATE on matches WHERE id = X)
  Purpose: Score changes, status changes, period transitions
  Consumers: Dashboard, Standings (indirect)

Global channel: matches:status
  Type: Postgres Changes (UPDATE on matches, filter on status column)
  Purpose: Match going live / finishing — triggers dashboard re-render
  Consumers: Dashboard, Fixtures page
```

### 6.2 Data Flow: Scorer Inputs a Goal

```
1. Scorer taps [Goal] -> selects player from roster dropdown
2. Client POST to /api/match-event (Next.js API route)
3. API route validates: is this scorer assigned to this match? Is match live?
4. API route INSERTs into match_events + UPDATEs matches.home_score
5. Supabase triggers Realtime:
   a. match:{id}:events channel fires -> all viewers see new event in feed
   b. match:{id}:score channel fires -> all viewers see updated score
6. If any push_subscriptions follow this team -> Edge Function sends push notification
```

### 6.3 Clock Synchronization Strategy

The game clock is **not** stored as a continuously-updating DB field. Instead:

- `matches.period_start_time` = timestamp when the current period's clock was started/resumed
- `matches.clock_running` = boolean
- Any client can compute elapsed time: `now() - period_start_time + accumulated_offset`
- Clock ticks are broadcast (not persisted) for UI smoothness
- On pause/resume, the scorer updates the DB -> Postgres Changes pushes to all clients
- Late joiners read the DB state and compute from there (no replay needed)

---

## 7. Phased Build Roadmap

### Phase 1: Foundation (Week 1-2)

**Goal:** Project scaffolding, database, basic CRUD, and a viewable match page.

- [ ] Initialize Next.js 15 project with TypeScript, Tailwind CSS, App Router
- [ ] Set up Supabase project: database, auth, storage bucket
- [ ] Create database schema (all tables from section 4.2) + RLS policies
- [ ] Generate TypeScript types from Supabase schema
- [ ] Build shared layout: header with sport switcher, navigation, footer
- [ ] Implement admin auth (login/logout)
- [ ] Admin CRUD: sports, seasons, teams, players (basic forms, no polish)
- [ ] Seed data: create the 3 sports, a test season, a few teams, and players
- [ ] Static match page: display a match with hardcoded data to validate the layout

**Deliverable:** Admin can create teams/players/seasons. Match page renders (not live yet).

### Phase 2: Live Scoring Engine (Week 3-4)

**Goal:** A scorer can run a live match end-to-end, and viewers see real-time updates.

- [ ] Admin: schedule matches, assign scorers
- [ ] Scorer auth flow (login -> see assigned matches)
- [ ] Scorer panel: game clock controls (start/pause/resume/end period)
- [ ] Scorer panel: event input for **football** (goal, card, sub, foul — all event types)
- [ ] Player selection UI (tap event -> pick player from roster)
- [ ] Undo last event functionality
- [ ] Match status transitions: scheduled -> live -> halftime -> live -> finished
- [ ] Supabase Realtime: wire up `match_events` and `matches` channels
- [ ] Live match page: real-time score updates, play-by-play feed
- [ ] Clock sync: broadcast channel for ticks, DB state for pause/resume
- [ ] Dashboard: live match cards with real-time scores

**Deliverable:** Full live football match can be scored and watched in real-time.

### Phase 3: Multi-Sport + Standings (Week 5-6)

**Goal:** Basketball and volleyball scoring, league standings, fixtures page.

- [ ] Scorer panel: basketball variant (2pt/3pt/FT, quarters, different event types)
- [ ] Scorer panel: volleyball variant (rally scoring, sets, rotations)
- [ ] Sport-specific match page layouts (quarter scores for basketball, set scores for volleyball)
- [ ] Standings: computed view or query — league table per season
- [ ] Standings page with sort, form guide (last 5 results)
- [ ] Fixtures & results page with filters (sport, team, date range, matchday)
- [ ] Sport home pages (`/football`, `/basketball`, `/volleyball`)

**Deliverable:** All three sports fully scorable. Standings and fixtures visible.

### Phase 4: Profiles + Polish (Week 7-8)

**Goal:** Team/player pages, search, UI polish, mobile optimization.

- [ ] Team profile page: roster, record, fixtures, results
- [ ] Player profile page: photo, stats summary, recent appearances
- [ ] Player season stats aggregation (goals, assists, cards, points — per sport)
- [ ] Search functionality (teams, players, matches)
- [ ] Follow teams (localStorage-based, UI indicators)
- [ ] Image upload for team logos and player photos (Supabase Storage)
- [ ] Responsive polish: ensure scorer panel works flawlessly on phones
- [ ] Loading states, error states, empty states across all pages
- [ ] Dark mode support

**Deliverable:** Full browsing experience. Team and player pages live. Mobile-polished.

### Phase 5: Notifications + PWA (Week 9-10)

**Goal:** Push notifications, PWA install, production hardening.

- [ ] Service worker for PWA (app shell caching, offline fallback page)
- [ ] PWA manifest (icons, theme color, standalone display)
- [ ] Web Push: subscription flow (follow team -> prompt for push permission)
- [ ] Supabase Edge Function: on match_events INSERT, check push_subscriptions, send notifications
- [ ] Notification types: match started, goal/key event, match finished (with final score)
- [ ] Match reminder notifications (N minutes before followed team plays)
- [ ] Admin announcements: create/edit, display on homepage
- [ ] Performance optimization: image optimization, lazy loading, prefetching
- [ ] Supabase RLS audit: tighten all policies for production
- [ ] Error monitoring setup (Sentry or similar)

**Deliverable:** Installable PWA with push notifications. Production-ready.

### Phase 6: Future Enhancements (Post-Launch)

- [ ] Top scorers / assists / stats leaders per season
- [ ] Match highlights / photo gallery
- [ ] Head-to-head team comparisons
- [ ] Season history / archives
- [ ] Multiple admin roles (league commissioner, team manager)
- [ ] Referee assignment and tracking
- [ ] Fan predictions / polls
- [ ] Multi-school expansion (data isolation per school)
- [ ] Native mobile app (React Native, sharing the API layer)

---

## 8. Project Structure

```
acity-sports-app/
├── public/
│   ├── icons/                     # PWA icons
│   ├── manifest.json              # PWA manifest
│   └── sw.js                      # Service worker
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx             # Root layout (header, sport switcher, footer)
│   │   ├── page.tsx               # Home / Dashboard
│   │   ├── [sport]/
│   │   │   └── page.tsx           # Sport home page
│   │   ├── match/
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Live match view
│   │   ├── standings/
│   │   │   └── [sport]/
│   │   │       └── page.tsx       # League standings
│   │   ├── fixtures/
│   │   │   └── [sport]/
│   │   │       └── page.tsx       # Fixtures & results
│   │   ├── team/
│   │   │   └── [slug]/
│   │   │       └── page.tsx       # Team profile
│   │   ├── player/
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Player profile
│   │   ├── search/
│   │   │   └── page.tsx           # Search page
│   │   ├── scorer/
│   │   │   ├── login/
│   │   │   │   └── page.tsx       # Scorer login
│   │   │   └── match/
│   │   │       └── [id]/
│   │   │           └── page.tsx   # Live scoring panel
│   │   └── admin/
│   │       ├── login/
│   │       │   └── page.tsx       # Admin login
│   │       ├── page.tsx           # Admin dashboard
│   │       ├── teams/
│   │       │   └── page.tsx       # Manage teams
│   │       ├── players/
│   │       │   └── page.tsx       # Manage players
│   │       ├── seasons/
│   │       │   └── page.tsx       # Manage seasons
│   │       ├── matches/
│   │       │   └── page.tsx       # Manage fixtures
│   │       ├── announcements/
│   │       │   └── page.tsx       # Manage announcements
│   │       └── scorers/
│   │           └── page.tsx       # Manage scorer accounts
│   ├── components/
│   │   ├── ui/                    # Reusable UI primitives (Button, Card, Modal)
│   │   ├── match/                 # MatchCard, PlayByPlayFeed, ScoreHeader, GameClock
│   │   ├── scorer/                # ScorerPanel, EventButton, PlayerPicker, ClockControls
│   │   ├── standings/             # StandingsTable, FormGuide
│   │   ├── team/                  # TeamCard, RosterList
│   │   ├── player/                # PlayerCard, StatsSummary
│   │   └── layout/                # Header, Footer, SportSwitcher, SearchBar
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts          # Browser Supabase client
│   │   │   ├── server.ts          # Server-side Supabase client
│   │   │   ├── realtime.ts        # Channel subscription helpers
│   │   │   └── types.ts           # Auto-generated DB types
│   │   ├── sports/
│   │   │   ├── football.ts        # Football-specific event config, scoring rules
│   │   │   ├── basketball.ts      # Basketball-specific config
│   │   │   └── volleyball.ts      # Volleyball-specific config
│   │   ├── clock.ts               # Game clock computation logic
│   │   ├── standings.ts           # Standings computation helpers
│   │   ├── notifications.ts       # Push subscription management
│   │   └── utils.ts               # Shared utilities
│   ├── hooks/
│   │   ├── useRealtimeMatch.ts    # Subscribe to live match updates
│   │   ├── useGameClock.ts        # Game clock tick + display
│   │   ├── useFollowedTeams.ts    # localStorage-based team following
│   │   └── useAuth.ts             # Auth state management
│   └── types/
│       └── index.ts               # App-level TypeScript types
├── supabase/
│   ├── migrations/                # SQL migration files
│   ├── seed.sql                   # Seed data for development
│   └── config.toml                # Supabase local dev config
├── .env.local                     # Supabase URL + anon key (gitignored)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── ARCHITECTURE.md                # This file
```

---

## 9. Key Technical Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scorer loses phone connection mid-match | Events stop flowing; fans see stale score | Scorer panel queues events offline (localStorage) and replays on reconnect. Clock state cached locally. |
| Supabase Realtime latency spike | Fans see delayed scores | Broadcast channel for clock (lightweight), Postgres Changes only for events. Fallback: polling every 10s if WebSocket drops. |
| Wrong event logged by scorer | Incorrect score shown to all viewers | Undo button (soft-delete last event + recalculate score). Admin can edit any event post-hoc. |
| Multiple concurrent viewers overload Realtime | Channel limits hit | Supabase Pro plan supports thousands of concurrent connections. Monitor usage; upgrade tier if needed. |
| Sport-specific complexity creep | Volleyball sets, basketball quarters add UI/logic branches | Isolate sport-specific logic in `lib/sports/[sport].ts` config files. Shared components consume config. |

---

## 10. Open Questions for Future Sessions

1. **Branding:** App name, logo, color scheme — to be designed.
2. **Venues:** Fixed list of ACity venues, or free-text per match?
3. **Tournaments:** Will there be knockout/cup formats, or only league (round-robin)?
4. **Player transfers:** Can players move between teams mid-season?
5. **Stats depth:** Basic stats (goals, assists, cards) at launch — how deep should per-game player stats go (minutes played, pass accuracy, rebounds, etc.)?
6. **Media:** Will there be match photos, video highlights, or text-only at launch?
