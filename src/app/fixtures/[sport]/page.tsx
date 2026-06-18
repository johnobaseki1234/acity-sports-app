import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatMatchDate, formatMatchTime, getStatusLabel } from "@/lib/utils/match";
import { SportIcon } from "@/components/ui/SportIcon";
import type { Match, Season, Sport, Team } from "@/lib/supabase/types";

const MATCH_SELECT = `
  *,
  home_team:teams!matches_home_team_id_fkey(*),
  away_team:teams!matches_away_team_id_fkey(*),
  season:seasons(*, sport:sports(*))
`;

export default async function FixturesPage({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string }>;
  searchParams: Promise<{ status?: string; team?: string }>;
}) {
  const [{ sport: sportSlug }, filters] = await Promise.all([params, searchParams]);
  const supabase = await createClient();

  const { data: sport } = await supabase
    .from("sports")
    .select("*")
    .eq("slug", sportSlug)
    .single();

  if (!sport) notFound();

  const { data: season } = await supabase
    .from("seasons")
    .select("*, sport:sports(*)")
    .eq("sport_id", sport.id)
    .eq("is_active", true)
    .single();

  if (!season) {
    return <EmptyState sport={sport as Sport} message="No active season yet" />;
  }

  const [{ data: seasonTeams }, { data: matches }] = await Promise.all([
    supabase
      .from("season_teams")
      .select("team:teams(*)")
      .eq("season_id", season.id),
    supabase
      .from("matches")
      .select(MATCH_SELECT)
      .eq("season_id", season.id)
      .order("scheduled_at", { ascending: true }),
  ]);

  const teams = (seasonTeams ?? [])
    .map((row) => row.team)
    .filter(Boolean) as unknown as Team[];
  const selectedStatus = filters.status ?? "all";
  const selectedTeam = filters.team ?? "all";
  const filteredMatches = ((matches ?? []) as Match[]).filter((match) => {
    const statusMatches = selectedStatus === "all" || match.status === selectedStatus;
    const teamMatches = selectedTeam === "all" || match.home_team_id === selectedTeam || match.away_team_id === selectedTeam;
    return statusMatches && teamMatches;
  });
  const grouped = filteredMatches.reduce<Record<string, Match[]>>((acc, match) => {
    const key = formatMatchDate(match.scheduled_at);
    (acc[key] ??= []).push(match);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <PageHeader sport={sport as Sport} season={season as Season} active="fixtures" />

      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterLink label="All" href={`/fixtures/${sportSlug}`} active={selectedStatus === "all" && selectedTeam === "all"} />
        <FilterLink label="Upcoming" href={`/fixtures/${sportSlug}?status=scheduled`} active={selectedStatus === "scheduled"} />
        <FilterLink label="Live" href={`/fixtures/${sportSlug}?status=live`} active={selectedStatus === "live"} />
        <FilterLink label="Results" href={`/fixtures/${sportSlug}?status=finished`} active={selectedStatus === "finished"} />
      </div>

      {teams.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <FilterLink label="All teams" href={`/fixtures/${sportSlug}${selectedStatus === "all" ? "" : `?status=${selectedStatus}`}`} active={selectedTeam === "all"} />
          {teams.map((team) => {
            const params = new URLSearchParams();
            if (selectedStatus !== "all") params.set("status", selectedStatus);
            params.set("team", team.id);
            return (
              <FilterLink
                key={team.id}
                label={team.short_name}
                href={`/fixtures/${sportSlug}?${params.toString()}`}
                active={selectedTeam === team.id}
              />
            );
          })}
        </div>
      )}

      <div className="space-y-5">
        {Object.entries(grouped).map(([date, dayMatches]) => (
          <section key={date}>
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">{date}</h2>
            <div className="space-y-3">
              {dayMatches.map((match) => <FixtureRow key={match.id} match={match} />)}
            </div>
          </section>
        ))}
      </div>

      {filteredMatches.length === 0 && <EmptyState sport={sport as Sport} message="No fixtures match these filters" />}
    </div>
  );
}

function FixtureRow({ match }: { match: Match }) {
  const showScore = match.status === "live" || match.status === "halftime" || match.status === "finished";

  return (
    <Link href={`/match/${match.id}`} className="score-card block">
      <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
        <span>{formatMatchTime(match.scheduled_at)} · {match.venue}</span>
        <span className="font-semibold">{getStatusLabel(match.status)}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="text-right font-semibold">{match.home_team?.name}</div>
        <div className="text-center font-black tabular-nums text-lg min-w-16">
          {showScore ? `${match.home_score} - ${match.away_score}` : "vs"}
        </div>
        <div className="font-semibold">{match.away_team?.name}</div>
      </div>
      {match.matchday && <div className="mt-2 text-center text-xs text-gray-400">Matchday {match.matchday}</div>}
    </Link>
  );
}

function PageHeader({
  sport,
  season,
  active,
}: {
  sport: Sport;
  season: Season;
  active: "standings" | "fixtures";
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{season.name}</p>
        <h1 className="flex items-center gap-2.5 text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
          <SportIcon slug={sport.slug} className="h-8 w-8 text-red-600 dark:text-red-500" />
          {sport.name} Fixtures
        </h1>
      </div>
      <div className="flex gap-2.5">
        <Link href={`/standings/${sport.slug}`} className={`sport-pill ${active === "standings" ? "sport-pill-active" : "sport-pill-inactive"}`}>Standings</Link>
        <Link href={`/fixtures/${sport.slug}`} className={`sport-pill ${active === "fixtures" ? "sport-pill-active" : "sport-pill-inactive"}`}>Fixtures</Link>
      </div>
    </div>
  );
}

function FilterLink({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
        active
          ? "bg-red-600 text-white shadow-md shadow-red-600/25"
          : "bg-white/70 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"
      }`}
    >
      {label}
    </Link>
  );
}

function EmptyState({ sport, message }: { sport: Sport; message: string }) {
  return (
    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl py-16 text-center shadow-lg">
      <div className="mx-auto mb-3 grid place-items-center h-16 w-16 rounded-3xl bg-red-500/10 text-red-600 dark:text-red-500">
        <SportIcon slug={sport.slug} className="h-8 w-8" />
      </div>
      <p className="font-medium text-zinc-500 dark:text-zinc-400">{message}</p>
    </div>
  );
}
