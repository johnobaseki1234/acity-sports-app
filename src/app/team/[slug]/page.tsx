import { createClient } from "../../../lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Award, Play, Users } from "lucide-react";
import FollowButton from "../../../components/ui/FollowButton";
import type { Match, Player } from "../../../lib/supabase/types";

interface TeamPageProps {
  params: Promise<{ slug: string }>;
}

type CareerStats = {
  player_id: string;
  sport_slug?: string | null;
  goals?: number | null;
  saves?: number | null;
  yellow_cards?: number | null;
  red_cards?: number | null;
  two_pointers_made?: number | null;
  three_pointers_made?: number | null;
  free_throws_made?: number | null;
  rebounds?: number | null;
  steals?: number | null;
  blocks?: number | null;
};

function telemetry(stats: CareerStats | undefined): { label: string; value: number }[] {
  if (!stats) return [
    { label: "PTS", value: 0 },
    { label: "REB", value: 0 },
    { label: "STL", value: 0 },
  ];
  if (stats.sport_slug === "football") {
    return [
      { label: "GLS", value: stats.goals ?? 0 },
      { label: "SAV", value: stats.saves ?? 0 },
      { label: "CRD", value: (stats.yellow_cards ?? 0) + (stats.red_cards ?? 0) },
    ];
  }
  const pts =
    (stats.two_pointers_made ?? 0) * 2 +
    (stats.three_pointers_made ?? 0) * 3 +
    (stats.free_throws_made ?? 0);
  return [
    { label: "PTS", value: pts },
    { label: "REB", value: stats.rebounds ?? 0 },
    { label: "STL", value: stats.steals ?? 0 },
  ];
}

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

  // Career telemetry for the scout cards.
  const statsByPlayer = new Map<string, CareerStats>();
  if (allPlayers.length > 0) {
    const { data: careerStats } = await supabase
      .from("player_stats")
      .select("*")
      .in("player_id", allPlayers.map((p) => p.id));
    for (const row of (careerStats ?? []) as CareerStats[]) {
      statsByPlayer.set(row.player_id, row);
    }
  }

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

      {/* Scout Roster Hub */}
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeRoster.map((player) => (
              <ScoutCard
                key={player.id}
                player={player}
                stats={statsByPlayer.get(player.id)}
                teamColor={team.primary_color}
              />
            ))}
          </div>
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

/** High-density Hudl-style scout card: telemetry header, position tag, film slot. */
function ScoutCard({
  player,
  stats,
  teamColor,
}: {
  player: Player;
  stats?: CareerStats;
  teamColor?: string | null;
}) {
  const tiles = telemetry(stats);
  return (
    <Link
      href={`/player/${player.id}`}
      className="group rounded-2xl border border-white/10 bg-zinc-900/70 overflow-hidden hover:border-vanguard-volt/40 transition-colors"
    >
      {/* Career telemetry header */}
      <div className="grid grid-cols-3 divide-x divide-white/5 bg-white/[0.03] border-b border-white/10">
        {tiles.map((t) => (
          <div key={t.label} className="px-2 py-2 text-center">
            <div className="text-base font-black tabular-nums text-vanguard-volt leading-none">
              {t.value}
            </div>
            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mt-1">
              {t.label}
            </div>
          </div>
        ))}
      </div>

      {/* Identity row */}
      <div className="flex items-center gap-3 px-3 py-3">
        <span
          className="grid place-items-center h-10 w-10 shrink-0 rounded-xl font-black text-sm tabular-nums text-white"
          style={{ background: teamColor ?? "#27272a" }}
        >
          {player.jersey_number}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm text-white truncate group-hover:text-vanguard-volt transition-colors">
            {player.name}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            {player.position && (
              <span className="rounded border border-vanguard-volt/40 text-vanguard-volt text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5">
                {player.position}
              </span>
            )}
            {player.secondary_position && (
              <span className="rounded border border-white/15 text-zinc-400 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5">
                {player.secondary_position}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Game film slot — aspect-locked, Hudl-ready */}
      <div className="mx-3 mb-3 aspect-video rounded-xl border border-white/10 bg-black/40 grid place-items-center relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-vanguard-volt/[0.05] to-transparent" />
        <div className="relative flex flex-col items-center gap-1">
          <span className="grid place-items-center h-8 w-8 rounded-full bg-white/10 group-hover:bg-vanguard-volt group-hover:text-black text-vanguard-volt transition-colors">
            <Play className="h-3.5 w-3.5" fill="currentColor" />
          </span>
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600">
            Film Room · Soon
          </span>
        </div>
      </div>
    </Link>
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
