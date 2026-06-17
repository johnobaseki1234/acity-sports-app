import { createClient } from "@/lib/supabase/server";
import { MatchCard } from "@/components/matches/MatchCard";
import { LiveScoreboard } from "@/components/matches/LiveScoreboard";
import { formatMatchDate } from "@/lib/utils/match";
import type { Match } from "@/lib/supabase/types";

const MATCH_SELECT = `
  *,
  home_team:teams!matches_home_team_id_fkey(*),
  away_team:teams!matches_away_team_id_fkey(*),
  season:seasons(*, sport:sports(*))
`;

async function getMatches() {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const threeDaysAhead = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("matches")
    .select(MATCH_SELECT)
    .gte("scheduled_at", twoDaysAgo)
    .lte("scheduled_at", threeDaysAhead)
    .order("scheduled_at", { ascending: true });

  return (data ?? []) as Match[];
}

export default async function HomePage() {
  const matches = await getMatches();

  const live = matches.filter((m) => m.status === "live" || m.status === "halftime");
  const upcoming = matches.filter((m) => m.status === "scheduled");
  const recent = matches.filter((m) => m.status === "finished").slice(-5).reverse();

  return (
    <div className="space-y-6">
      {/* Live Now — real-time client component */}
      <LiveScoreboard initialLive={live} />

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section>
          <SectionHeader label="📅 Upcoming" />
          <UpcomingList matches={upcoming} />
        </section>
      )}

      {/* Recent Results */}
      {recent.length > 0 && (
        <section>
          <SectionHeader label="✅ Recent Results" />
          <div className="space-y-3">
            {recent.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      )}

      {matches.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🏆</div>
          <p className="font-medium">No matches scheduled yet</p>
          <p className="text-sm">Check back when the season starts</p>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h2 className="font-bold text-sm uppercase tracking-wide text-gray-500">{label}</h2>
      {count !== undefined && (
        <span className="bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  );
}

function UpcomingList({ matches }: { matches: Match[] }) {
  // Group by date
  const grouped = matches.reduce<Record<string, Match[]>>((acc, m) => {
    const key = formatMatchDate(m.scheduled_at);
    (acc[key] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([date, dayMatches]) => (
        <div key={date}>
          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">{date}</p>
          <div className="space-y-3">
            {dayMatches.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
