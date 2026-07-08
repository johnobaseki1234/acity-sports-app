import { createClient } from "../../../lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Award, Users } from "lucide-react";
import FollowButton from "../../../components/ui/FollowButton";
import { computeCareerAverages, type CareerTotals } from "../../../lib/stats/careerAverages";
import type { Match, Player } from "../../../lib/supabase/types";

interface TeamPageProps {
  params: Promise<{ slug: string }>;
}

type CareerStats = CareerTotals & {
  player_id: string;
  sport_slug?: string | null;
};

export default async function TeamProfilePage({ params }: TeamPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("slug", slug)
    .single();

  if (teamError || !team) {
    notFound();
  }

  const [{ data: players, error: playersError }, { data: matches, error: matchesError }] = await Promise.all([
    supabase
      .from("players")
      .select("*")
      .eq("team_id", team.id)
      .order("jersey_number", { ascending: true }),
    supabase
      .from("matches")
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*)
      `)
      .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
      .order("scheduled_at", { ascending: true }),
  ]);

  if (playersError) {
    throw new Error(`Unable to load team roster: ${playersError.message}`);
  }
  if (matchesError) {
    throw new Error(`Unable to load team matches: ${matchesError.message}`);
  }

  const allPlayers = (players ?? []) as Player[];
  // A missing status (pre-migration rows) is treated as active.
  const activeRoster = allPlayers.filter((p) => (p.status ?? "active") === "active");
  const retired = allPlayers.filter((p) => p.status === "retired");
  const alumni = allPlayers.filter((p) => p.status === "alumni");

  // Career per-game averages for the scouting matrix.
  const statsByPlayer = new Map<string, CareerStats>();
  const gamesByPlayer = new Map<string, number>();
  if (allPlayers.length > 0) {
    const playerIds = allPlayers.map((p) => p.id);
    const [{ data: careerStats }, { data: gameCounts }] = await Promise.all([
      supabase.from("player_stats").select("*").in("player_id", playerIds),
      supabase.from("player_game_counts").select("player_id, games_played").in("player_id", playerIds),
    ]);
    for (const row of (careerStats ?? []) as CareerStats[]) {
      statsByPlayer.set(row.player_id, row);
    }
    for (const row of gameCounts ?? []) {
      gamesByPlayer.set(row.player_id, row.games_played);
    }
  }

  const rosterWithAverages = activeRoster
    .map((player) => {
      const stats = statsByPlayer.get(player.id);
      const games = gamesByPlayer.get(player.id) ?? 0;
      const averages = computeCareerAverages(stats, games, stats?.sport_slug ?? "basketball");
      return { player, averages };
    })
    .sort((a, b) => (b.averages?.lines[0]?.value ?? -1) - (a.averages?.lines[0]?.value ?? -1));

  const allMatches = (matches ?? []) as Match[];
  const results = allMatches
    .filter((m) => m.status === "finished")
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
  const fixtures = allMatches
    .filter((m) => m.status !== "finished")
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  let wins = 0;
  let draws = 0;
  let losses = 0;

  results.forEach((match) => {
    const isHome = match.home_team_id === team.id;
    if (match.home_score === match.away_score) {
      draws++;
    } else if (
      (isHome && match.home_score > match.away_score) ||
      (!isHome && match.away_score > match.home_score)
    ) {
      wins++;
    } else {
      losses++;
    }
  });

  return (
    <div className="max-w-6xl mx-auto py-4 space-y-8">
      {/* Team masthead */}
      <div
        className="rounded-2xl p-6 sm:p-8 text-white border border-white/10 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${team.primary_color || "#0D0E10"}cc, #0D0E10 70%)`,
        }}
      >
        <div className="relative flex flex-col sm:flex-row items-center gap-6">
          {team.logo_url ? (
            <img src={team.logo_url} alt={team.name} className="w-24 h-24 object-contain bg-white/10 rounded-xl p-2" />
          ) : (
            <div className="w-24 h-24 bg-white/10 border border-white/15 rounded-xl flex items-center justify-center text-3xl font-black">
              {team.short_name}
            </div>
          )}
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{team.name}</h1>
            <p className="text-white/70 font-semibold mt-1 tabular-nums">
              Record: <span className="text-vanguard-volt">{wins}W</span> · {draws}D ·{" "}
              <span className="text-vanguard-crimson">{losses}L</span>
            </p>
            <FollowButton teamId={team.id} />
          </div>
        </div>
      </div>

      {/* Scouting Matrix — dense roster table, sorted by per-game impact */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-vanguard-volt" strokeWidth={2.25} />
          <h2 className="text-xl font-black tracking-tight text-white">Roster</h2>
          <span className="rounded-full bg-vanguard-volt/15 text-vanguard-volt text-xs font-black px-2 py-0.5 tabular-nums">
            {activeRoster.length}
          </span>
        </div>

        {activeRoster.length === 0 ? (
          <p className="text-zinc-500 text-sm">No active players on this team yet.</p>
        ) : (
          <ScoutingMatrix rows={rosterWithAverages} teamColor={team.primary_color} />
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5">
          <h2 className="text-sm font-black uppercase tracking-wider text-zinc-300 mb-4 pb-2 border-b border-white/10">
            Upcoming Fixtures
          </h2>
          {fixtures.length === 0 ? (
            <p className="text-zinc-500 text-sm">No upcoming matches scheduled.</p>
          ) : (
            <div className="space-y-2">
              {fixtures.map((match) => (
                <Link key={match.id} href={`/match/${match.id}`} className="px-3 py-2.5 rounded-xl border border-white/5 bg-white/[0.03] flex justify-between items-center gap-4 hover:border-vanguard-volt/40 transition">
                  <span className="text-sm font-semibold text-zinc-200 truncate">
                    {match.home_team?.name} vs {match.away_team?.name}
                  </span>
                  <span className="text-right text-xs text-zinc-500 shrink-0 tabular-nums">
                    {new Date(match.scheduled_at).toLocaleDateString()}<br />
                    <span className="font-bold capitalize text-vanguard-volt">{match.status}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5">
          <h2 className="text-sm font-black uppercase tracking-wider text-zinc-300 mb-4 pb-2 border-b border-white/10">
            Recent Results
          </h2>
          {results.length === 0 ? (
            <p className="text-zinc-500 text-sm">No match results available yet.</p>
          ) : (
            <div className="space-y-2">
              {results.map((match) => (
                <Link key={match.id} href={`/match/${match.id}`} className="px-3 py-2.5 rounded-xl border border-white/5 bg-white/[0.03] flex justify-between items-center gap-4 hover:border-vanguard-volt/40 transition">
                  <span className="text-sm text-zinc-300 tabular-nums">
                    <strong className={match.home_team_id === team.id ? "text-vanguard-volt" : "text-white"}>{match.home_team?.short_name}</strong>
                    {" "}<span className="font-black">{match.home_score} – {match.away_score}</span>{" "}
                    <strong className={match.away_team_id === team.id ? "text-vanguard-volt" : "text-white"}>{match.away_team?.short_name}</strong>
                  </span>
                  <span className="text-xs text-zinc-500 shrink-0 tabular-nums">{new Date(match.scheduled_at).toLocaleDateString()}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Historic archive — preserved without cluttering the active roster */}
      {(alumni.length > 0 || retired.length > 0) && (
        <div>
          <div className="flex items-center gap-2.5 mb-5">
            <Award className="h-6 w-6 text-vanguard-volt" strokeWidth={2} />
            <h2 className="text-xl font-black tracking-tight text-white">Hall of Fame &amp; Archive</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ArchiveGroup
              title="Alumni"
              subtitle="Graduated student athletes"
              accent="from-amber-500 to-yellow-600"
              players={alumni}
            />
            <ArchiveGroup
              title="Retired Players"
              subtitle="Career stats preserved"
              accent="from-zinc-600 to-zinc-800"
              players={retired}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** High-density scouting matrix: avatar, position, true per-game rate averages — sorted by impact. */
function ScoutingMatrix({
  rows,
  teamColor,
}: {
  rows: { player: Player; averages: ReturnType<typeof computeCareerAverages> }[];
  teamColor?: string | null;
}) {
  // Column set follows whichever sport the top-ranked player belongs to;
  // mixed-sport rosters are rare, and every row still shows its own values.
  const columns = rows[0]?.averages?.lines.map((l) => l.label) ?? ["PPG", "RPG", "APG"];

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-900/70">
      <table className="w-full min-w-[480px] text-sm">
        <thead className="bg-white/[0.03] border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-500">
          <tr>
            <th className="pl-4 pr-2 py-2.5 text-left font-black">Player</th>
            <th className="px-2 py-2.5 text-center font-black hidden sm:table-cell">GP</th>
            {columns.map((label) => (
              <th key={label} className="px-2 py-2.5 text-center font-black">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ player, averages }, index) => (
            <tr
              key={player.id}
              className={`border-b border-white/5 last:border-0 hover:bg-white/[0.04] transition-colors ${
                index === 0 ? "bg-vanguard-volt/[0.05]" : ""
              }`}
            >
              <td className="pl-4 pr-2 py-2">
                <Link href={`/player/${player.id}`} className="group/pl flex items-center gap-3 min-w-0">
                  {player.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={player.photo_url}
                      alt={player.name}
                      className="h-8 w-8 shrink-0 rounded-lg object-cover border border-white/10"
                    />
                  ) : (
                    <span
                      className="grid place-items-center h-8 w-8 shrink-0 rounded-lg font-black text-xs tabular-nums text-white"
                      style={{ background: teamColor ?? "#27272a" }}
                    >
                      {player.jersey_number}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white truncate group-hover/pl:text-vanguard-volt transition-colors">
                      {player.name}
                    </p>
                    {player.position && (
                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                        {player.position}
                        {player.secondary_position ? ` / ${player.secondary_position}` : ""}
                      </p>
                    )}
                  </div>
                </Link>
              </td>
              <td className="px-2 py-2 text-center tabular-nums text-xs text-zinc-500 hidden sm:table-cell">
                {averages?.gamesPlayed ?? 0}
              </td>
              {columns.map((label, i) => {
                const value = averages?.lines[i]?.value;
                return (
                  <td
                    key={label}
                    className={`px-2 py-2 text-center tabular-nums font-black ${
                      index === 0 ? "text-vanguard-volt" : "text-zinc-200"
                    }`}
                  >
                    {value ?? "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ArchiveGroup({
  title,
  subtitle,
  accent,
  players,
}: {
  title: string;
  subtitle: string;
  accent: string;
  players: Player[];
}) {
  if (players.length === 0) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/70 overflow-hidden">
      <div className={`bg-gradient-to-r ${accent} px-5 py-4 text-white`}>
        <h3 className="text-lg font-black">{title}</h3>
        <p className="text-white/80 text-xs">{subtitle} · {players.length}</p>
      </div>
      <ul className="divide-y divide-white/5 p-2">
        {players.map((player) => (
          <li key={player.id}>
            <Link
              href={`/player/${player.id}`}
              className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 transition"
            >
              <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-zinc-300 shrink-0 tabular-nums">
                #{player.jersey_number}
              </div>
              <span className="font-semibold text-zinc-200">{player.name}</span>
              {player.position && (
                <span className="ml-auto rounded border border-white/15 text-zinc-400 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 shrink-0">
                  {player.position}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
