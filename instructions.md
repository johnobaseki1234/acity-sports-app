
# ROLE AND MISSION
You are an Elite Senior Full-Stack Engineer and Autonomous QA Agent. Your mission is to take full ownership of this Next.js + Supabase application and complete a 100% flawless implementation of Phases 1 through 4. No cutting corners, no placeholder logic, and no incomplete features. We cannot afford back-and-forth loops that waste API credits. Your goal is absolute execution, rigorous debugging, and clean architecture on the first try.

---

## 1. CURRENT PROJECT CONTEXT
We are actively executing Phase 4 (Profiles & Polish), but you must treat Phases 1–3 as scope under your review. You must guarantee that everything across all four phases is complete, interconnected, and operational. 

Here is our exact project structure:

src/
├── middleware.ts
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── admin/ (layout, matches, players, seasons, teams routes)
│   ├── auth/ (signout route)
│   ├── fixtures/[sport]/page.tsx
│   ├── login/ (LoginForm, page.tsx)
│   ├── match/[id]/page.tsx
│   ├── player/[id]/ (error, loading, page.tsx)
│   ├── scorer/ (layout, [id]/page.tsx)
│   ├── search/ (page.tsx)
│   ├── sport/[slug]/page.tsx
│   ├── standings/[sport]/page.tsx
│   └── team/[slug]/ (error, loading, page.tsx)
├── components/
│   ├── admin/ (AdminNav, MatchForm, PlayerForm, SeasonForm, TeamForm)
│   ├── layout/ (Header.tsx)
│   ├── matches/ (LiveMatchView, LiveScoreboard, MatchCard)
│   ├── scorer/ (EventLog, PlayerPicker, ScorerConsole)
│   └── ui/ (FollowButton.tsx)
├── hooks/
│   └── useFollowedTeams.ts
└── lib/
    ├── storage/ (uploadImage.ts)
    ├── supabase/ (client.ts, server.ts, types.ts)
    └── utils/ (match.ts, periodScores.ts, standings.ts)

---

## 2. THE TOTAL AUDIT & EXECUTION CHECKLIST
You must sequentially audit, verify, and complete any missing gaps or broken connections across these core mechanics:

### PHASE 1 - 3 CORE VERIFICATION
* **Database & Type Safety:** Ensure all data operations match the types in `src/lib/supabase/types.ts`.
* **Live Scoring Console:** Ensure `ScorerConsole.tsx` updates `match_events` live, and the `LiveScoreboard.tsx` reads them correctly.
* **Sports Logic:** Verify that rules for Football, Basketball, and Volleyball calculate properly according to their respective scoring increments.

### PHASE 4 COMPLETION (Profiles + Polish)
1.  **Team Profiles (`/team/[slug]`):** Dynamic banner, brand colors, full active player rosters, calculated wins/draws/losses record from finished matches, and chronological split of upcoming fixtures vs. recent results.
2.  **Player Profiles (`/player/[id]`):** Aggregation of all historical match events on the fly, dynamically accumulating goals, assists, cards, basketball points, rebounds, volleyball kills, and aces.
3.  **Global Search (`/search`):** Real-time text filtering via Supabase `.ilike` queries searching teams, players, and match venues simultaneously.
4.  **UI Integration:** Add a clear Search Link/Button directly into the main global navbar layout (`src/components/layout/Header.tsx`) so the feature is globally accessible.
5.  **Local Storage Engine:** Ensure `useFollowedTeams.ts` saves/reads array states in the browser's `localStorage` and toggles seamlessly on the client via the `FollowButton`.
6.  **Storage Pipeline:** Verify that `uploadImage.ts` converts file streams and pushes cleanly to the `team-logos` and `player-photos` Supabase storage buckets, returning clean public URLs.
7.  **UX Boundaries:** Verify that Next.js App Router sub-loading screens and error boundaries gracefully catch processing/network exceptions.

---

## 3. STRICT OPERATIONAL MANDATES

### A. Fix Dynamic Route Params (Next.js App Router)
Next.js requires dynamic page parameters (`params`) to be handled asynchronously. Ensure that every dynamic page file (such as `team/[slug]/page.tsx`, `player/[id]/page.tsx`, and `match/[id]/page.tsx`) explicitly awaits `params` before executing queries:
```tsx
interface PageProps {
  params: Promise<{ id: string }>;
}
export default async function Page({ params }: PageProps) {
  const { id } = await params;
  // Next step: execute queries...
}

```

### B. Handle Shortcut Path Aliases Explicitly

If path aliases (`@/*`) cause resolution warnings or linter failures within the local Next.js compiler environment, adjust imports to absolute relative paths (`../../`) instantly to preserve build health.

### C. Run, Test, and Output Fixes Step-by-Step

1. Instruct me on what to look for on my running development server (`npm run dev`).
2. Ask targeted questions about database behavior or logs if a specific component hangs or goes blank.
3. When providing code updates, supply complete, fully resolved file contents so I can replace the file entirely without introducing merging bugs.

Let's begin. Review the files listed in the folder structure, evaluate the dependencies, and tell me exactly how we are going to fix the page loading hang and ensure 100% completion of Phase 1 to Phase 4.

```

```