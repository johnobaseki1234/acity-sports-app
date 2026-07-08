import { createClient } from "@/lib/supabase/server";
import { Hero } from "@/components/home/Hero";
import { LeagueTags } from "@/components/home/LeagueTags";
import { LeagueFeed } from "@/components/home/LeagueFeed";
import { Reveal } from "@/components/motion/Motion";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatMatchDate } from "@/lib/utils/match";
import { getActiveSeasons } from "@/lib/utils/leagues";
import type { Match } from "@/lib/supabase/types";
import { CalendarX } from "lucide-react";

const MATCH_SELECT = `
  *,
  home_team:teams!matches_home_team_id_fkey(*),
  away_team:teams!matches_away_team_id_fkey(*),
  season:seasons(*, sport:sports(*))
`;

async function getMatches() {
  const supabase = await createClient();
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const threeDaysAhead = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("matches")
    .select(MATCH_SELECT)
    .gte("scheduled_at", twoDaysAgo)
    .lte("scheduled_at", threeDaysAhead)
    .order("scheduled_at", { ascending: true });

  if (data && data.length > 0) return data as Match[];

  // Quiet week: fall back to the latest results so the feed never renders empty.
  const { data: recent } = await supabase
    .from("matches")
    .select(MATCH_SELECT)
    .in("status", ["finished", "live", "halftime"])
    .order("scheduled_at", { ascending: false })
    .limit(12);

  return (recent ?? []) as Match[];
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ league?: string }>;
}) {
  const supabase = await createClient();
  const [matches, { league: activeLeague }, seasons] = await Promise.all([
    getMatches(),
    searchParams,
    getActiveSeasons(supabase),
  ]);

  const filtered = activeLeague
    ? matches.filter((m) => (m.season as any)?.id === activeLeague)
    : matches;

  const live = filtered.filter((m) => m.status === "live" || m.status === "halftime");

  const todayCount = matches.filter((m) => formatMatchDate(m.scheduled_at) === "Today").length;

  return (
    <div className="space-y-6">
      <Reveal>
        <Hero liveCount={live.length} todayCount={todayCount} />
      </Reveal>

      <Reveal delay={0.05}>
        <LeagueTags mode="filter" seasons={seasons} basePath="/" activeSeasonId={activeLeague} />
      </Reveal>

      {/* FlashScore-style league feed — realtime, grouped by tournament */}
      <LeagueFeed matches={filtered} />

      {filtered.length === 0 && (
        <Reveal>
          <EmptyState
            Icon={CalendarX}
            title="No matches scheduled yet"
            message="Live scores and fixtures will appear here as soon as the season kicks off."
          />
        </Reveal>
      )}
    </div>
  );
}
