import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeStandings } from "@/lib/utils/standings";
import { SportIcon } from "@/components/ui/SportIcon";
import type { Match, Season, Sport, Team } from "@/lib/supabase/types";

const MATCH_SELECT = `
  *,
  home_team:teams!matches_home_team_id_fkey(*),
  away_team:teams!matches_away_team_id_fkey(*),
  season:seasons(*, sport:sports(*))
`;

export default async function StandingsPage({ params }: { params: Promise<{ sport: string }> }) {
  const { sport: sportSlug } = await params;
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
  const table = computeStandings({
    teams,
    matches: (matches ?? []) as Match[],
    season: season as Season,
  });
  const isBasketball = sportSlug === "basketball";

  return (
    <div className="space-y-6">
      <PageHeader sport={sport as Sport} season={season as Season} active="standings" />

      <div className="overflow-x-auto bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-lg">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-xs uppercase text-zinc-400 dark:text-zinc-500 sticky top-0">
            <tr>
              <th className="px-3 py-3.5 text-left font-bold">Team</th>
              <th className="px-2 py-3.5 text-center font-bold">P</th>
              <th className="px-2 py-3.5 text-center font-bold">W</th>
              {!isBasketball && <th className="px-2 py-3.5 text-center font-bold">D</th>}
              <th className="px-2 py-3.5 text-center font-bold">L</th>
              <th className="px-2 py-3.5 text-center font-bold">{isBasketball ? "PF" : "F"}</th>
              <th className="px-2 py-3.5 text-center font-bold">{isBasketball ? "PA" : "A"}</th>
              <th className="px-2 py-3.5 text-center font-bold">{isBasketball ? "+/-" : "GD"}</th>
              <th className="px-3 py-3.5 text-center font-bold">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-200">
            {table.map((row, index) => (
              <tr
                key={row.team_id}
                className={index === 0 ? "bg-red-50/60 dark:bg-red-500/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"}
              >
                <td className="px-3 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`grid place-items-center w-6 h-6 rounded-lg text-[11px] font-black tabular-nums shrink-0 ${
                        index === 0 ? "bg-red-600 text-white" : "text-zinc-400"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span
                      className="h-7 w-7 rounded-lg shrink-0 hidden sm:block"
                      style={{ background: row.team?.primary_color ?? "#52525b" }}
                    />
                    <span className="font-bold text-zinc-900 dark:text-white truncate">{row.team?.name}</span>
                  </div>
                </td>
                <td className="px-2 py-3.5 text-center tabular-nums">{row.played}</td>
                <td className="px-2 py-3.5 text-center tabular-nums">{row.won}</td>
                {!isBasketball && <td className="px-2 py-3.5 text-center tabular-nums">{row.drawn}</td>}
                <td className="px-2 py-3.5 text-center tabular-nums">{row.lost}</td>
                <td className="px-2 py-3.5 text-center tabular-nums">{row.goals_for}</td>
                <td className="px-2 py-3.5 text-center tabular-nums">{row.goals_against}</td>
                <td
                  className={`px-2 py-3.5 text-center tabular-nums font-semibold ${
                    row.goal_diff > 0 ? "text-green-600 dark:text-green-400" : row.goal_diff < 0 ? "text-red-600 dark:text-red-400" : "text-zinc-400"
                  }`}
                >
                  {row.goal_diff > 0 ? "+" : ""}{row.goal_diff}
                </td>
                <td className="px-3 py-3.5 text-center font-black tabular-nums text-zinc-900 dark:text-white">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {table.length === 0 && <EmptyState sport={sport as Sport} message="No teams have been added to this season" />}
    </div>
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
          {sport.name} Standings
        </h1>
      </div>
      <div className="flex gap-2.5">
        <Link href={`/standings/${sport.slug}`} className={`sport-pill ${active === "standings" ? "sport-pill-active" : "sport-pill-inactive"}`}>Standings</Link>
        <Link href={`/fixtures/${sport.slug}`} className={`sport-pill ${active === "fixtures" ? "sport-pill-active" : "sport-pill-inactive"}`}>Fixtures</Link>
      </div>
    </div>
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
