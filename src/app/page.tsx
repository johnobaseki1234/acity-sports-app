import { createClient } from "@/lib/supabase/server";
import { MatchCard } from "@/components/matches/MatchCard";
import { LiveScoreboard } from "@/components/matches/LiveScoreboard";
import { Hero } from "@/components/home/Hero";
import { SportFilters } from "@/components/home/SportFilters";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Motion";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatMatchDate } from "@/lib/utils/match";
import type { Match } from "@/lib/supabase/types";
import { CalendarDays, History, CalendarX, type LucideIcon } from "lucide-react";

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

  return (data ?? []) as Match[];
}

export default async function HomePage() {
  const matches = await getMatches();

  const live = matches.filter((m) => m.status === "live" || m.status === "halftime");
  const upcoming = matches.filter((m) => m.status === "scheduled");
  const recent = matches.filter((m) => m.status === "finished").slice(-6).reverse();

  const todayCount = matches.filter((m) => formatMatchDate(m.scheduled_at) === "Today").length;
  const seasonName = matches[0]?.season?.name ?? "—";

  return (
    <div className="space-y-7">
      <Reveal>
        <Hero liveCount={live.length} todayCount={todayCount} seasonName={seasonName} />
      </Reveal>

      <Reveal delay={0.05}>
        <SportFilters />
      </Reveal>

      {/* Live Now — realtime client component */}
      <LiveScoreboard initialLive={live} />

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section>
          <SectionHeader Icon={CalendarDays} label="Upcoming" count={upcoming.length} />
          <UpcomingList matches={upcoming} />
        </section>
      )}

      {/* Recent Results */}
      {recent.length > 0 && (
        <section>
          <SectionHeader Icon={History} label="Recent Results" count={recent.length} />
          <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((m) => (
              <StaggerItem key={m.id}>
                <MatchCard match={m} />
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}

      {matches.length === 0 && (
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

function SectionHeader({ Icon, label, count }: { Icon: LucideIcon; label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3.5 px-0.5">
      <Icon className="h-5 w-5 text-red-600 dark:text-red-500" strokeWidth={2.25} />
      <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">{label}</h2>
      {count !== undefined && (
        <span className="rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 text-xs font-bold px-2 py-0.5">
          {count}
        </span>
      )}
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
    <div className="space-y-5">
      {Object.entries(grouped).map(([date, dayMatches]) => (
        <div key={date}>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500 mb-2.5 px-0.5">
            {date}
          </p>
          <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dayMatches.map((m) => (
              <StaggerItem key={m.id}>
                <MatchCard match={m} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      ))}
    </div>
  );
}
