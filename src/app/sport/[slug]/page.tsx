import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
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

const SPORT_META: Record<string, { label: string; icon: string }> = {
  football:   { label: "Football",   icon: "⚽" },
  basketball: { label: "Basketball", icon: "🏀" },
  volleyball: { label: "Volleyball", icon: "🏐" },
};

export default async function SportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = SPORT_META[slug];
  if (!meta) notFound();

  const supabase = await createClient();
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Get all matches then filter by sport slug from the nested join
  const { data } = await supabase
    .from("matches")
    .select(MATCH_SELECT)
    .gte("scheduled_at", twoDaysAgo)
    .lte("scheduled_at", sevenDaysAhead)
    .order("scheduled_at", { ascending: true });

  // Filter client-side by sport slug
  const matches = ((data ?? []) as Match[]).filter(
    (m) => (m.season as any)?.sport?.slug === slug
  );

  const live = matches.filter((m) => m.status === "live" || m.status === "halftime");
  const upcoming = matches.filter((m) => m.status === "scheduled");
  const recent = matches.filter((m) => m.status === "finished").slice(-8).reverse();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold pt-1">
        {meta.icon} {meta.label}
      </h1>

      <div className="flex gap-2">
        <Link href={`/standings/${slug}`} className="sport-pill sport-pill-inactive">Standings</Link>
        <Link href={`/fixtures/${slug}`} className="sport-pill sport-pill-inactive">Fixtures</Link>
      </div>

      <LiveScoreboard initialLive={live} sportSlug={slug} />

      {upcoming.length > 0 && (
        <section>
          <SectionHeader label="📅 Upcoming" />
          <UpcomingList matches={upcoming} />
        </section>
      )}

      {recent.length > 0 && (
        <section>
          <SectionHeader label="✅ Results" />
          <div className="space-y-3">
            {recent.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      )}

      {matches.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">{meta.icon}</div>
          <p className="font-medium">No matches scheduled</p>
          <p className="text-sm">Check back when the season starts</p>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h2 className="font-bold text-sm uppercase tracking-wide text-gray-500">{label}</h2>
    </div>
  );
}

function UpcomingList({ matches }: { matches: Match[] }) {
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
