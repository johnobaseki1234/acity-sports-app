import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeStandings } from "@/lib/utils/standings";
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
    <div className="space-y-5">
      <PageHeader sport={sport as Sport} season={season as Season} active="standings" />

      <div className="overflow-x-auto bg-white border border-gray-100 rounded-xl shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-3 py-3 text-left font-bold">Team</th>
              <th className="px-2 py-3 text-center font-bold">P</th>
              <th className="px-2 py-3 text-center font-bold">W</th>
              {!isBasketball && <th className="px-2 py-3 text-center font-bold">D</th>}
              <th className="px-2 py-3 text-center font-bold">L</th>
              <th className="px-2 py-3 text-center font-bold">{isBasketball ? "PF" : "F"}</th>
              <th className="px-2 py-3 text-center font-bold">{isBasketball ? "PA" : "A"}</th>
              <th className="px-2 py-3 text-center font-bold">{isBasketball ? "+/-" : "GD"}</th>
              <th className="px-3 py-3 text-center font-bold">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {table.map((row, index) => (
              <tr key={row.team_id}>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-xs font-bold text-gray-400 tabular-nums">{index + 1}</span>
                    <span className="font-semibold">{row.team?.name}</span>
                  </div>
                </td>
                <td className="px-2 py-3 text-center tabular-nums">{row.played}</td>
                <td className="px-2 py-3 text-center tabular-nums">{row.won}</td>
                {!isBasketball && <td className="px-2 py-3 text-center tabular-nums">{row.drawn}</td>}
                <td className="px-2 py-3 text-center tabular-nums">{row.lost}</td>
                <td className="px-2 py-3 text-center tabular-nums">{row.goals_for}</td>
                <td className="px-2 py-3 text-center tabular-nums">{row.goals_against}</td>
                <td className="px-2 py-3 text-center tabular-nums">{row.goal_diff}</td>
                <td className="px-3 py-3 text-center font-black tabular-nums">{row.points}</td>
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
    <div className="space-y-3">
      <div>
        <p className="text-sm text-gray-400">{season.name}</p>
        <h1 className="text-2xl font-bold">{sport.icon} {sport.name} Standings</h1>
      </div>
      <div className="flex gap-2">
        <Link href={`/standings/${sport.slug}`} className={`sport-pill ${active === "standings" ? "sport-pill-active" : "sport-pill-inactive"}`}>Standings</Link>
        <Link href={`/fixtures/${sport.slug}`} className={`sport-pill ${active === "fixtures" ? "sport-pill-active" : "sport-pill-inactive"}`}>Fixtures</Link>
      </div>
    </div>
  );
}

function EmptyState({ sport, message }: { sport: Sport; message: string }) {
  return (
    <div className="text-center py-16 text-gray-400">
      <div className="text-4xl mb-3">{sport.icon}</div>
      <p className="font-medium">{message}</p>
    </div>
  );
}
