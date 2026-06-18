import { createClient } from "../../../lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import FollowButton from "../../../components/ui/FollowButton";
import type { Match, Player } from "../../../lib/supabase/types";

interface TeamPageProps {
  params: Promise<{ slug: string }>;
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div
        className="rounded-2xl p-6 sm:p-8 text-white mb-8 shadow-md"
        style={{
          background: `linear-gradient(135deg, ${team.primary_color || "#1e3a8a"}, ${team.secondary_color || "#3b82f6"})`,
        }}
      >
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {team.logo_url ? (
            <img src={team.logo_url} alt={team.name} className="w-24 h-24 object-contain bg-white/10 rounded-xl p-2" />
          ) : (
            <div className="w-24 h-24 bg-white/20 rounded-xl flex items-center justify-center text-3xl font-bold">
              {team.short_name}
            </div>
          )}
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{team.name}</h1>
            <p className="text-white/80 font-medium mt-1">Record: {wins}W - {draws}D - {losses}L</p>
            <FollowButton teamId={team.id} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-zinc-50 border-b border-gray-100 dark:border-zinc-800 pb-2">
            Roster <span className="text-sm font-normal text-gray-400">({activeRoster.length})</span>
          </h2>
          {activeRoster.length === 0 ? (
            <p className="text-gray-500 dark:text-zinc-400 text-sm">No active players on this team yet.</p>
          ) : (
            <ul className="divide-y divide-gray-50 dark:divide-zinc-800">
              {activeRoster.map((player) => (
                <li key={player.id} className="py-3 flex items-center justify-between gap-3">
                  <Link href={`/player/${player.id}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition min-w-0">
                    <span className="font-mono text-gray-400 mr-2">#{player.jersey_number}</span>
                    <span className="font-medium text-gray-700 dark:text-zinc-200">{player.name}</span>
                  </Link>
                  {player.position && (
                    <span className="text-xs bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 px-2 py-1 rounded shrink-0">
                      {player.position}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Upcoming Fixtures</h2>
            {fixtures.length === 0 ? (
              <p className="text-gray-500 text-sm">No upcoming matches scheduled.</p>
            ) : (
              <div className="space-y-3">
                {fixtures.map((match) => (
                  <Link key={match.id} href={`/match/${match.id}`} className="p-4 border rounded-xl flex justify-between items-center gap-4 bg-gray-50/50 hover:border-blue-300 transition">
                    <span className="text-sm font-medium text-gray-600">{match.home_team?.name} vs {match.away_team?.name}</span>
                    <span className="text-right text-xs text-gray-500 shrink-0">
                      {new Date(match.scheduled_at).toLocaleDateString()}<br />
                      <span className="font-semibold capitalize text-blue-700">{match.status}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Recent Results</h2>
            {results.length === 0 ? (
              <p className="text-gray-500 text-sm">No match results available yet.</p>
            ) : (
              <div className="space-y-3">
                {results.map((match) => (
                  <Link key={match.id} href={`/match/${match.id}`} className="p-4 border rounded-xl flex justify-between items-center gap-4 hover:border-blue-300 transition">
                    <span className="text-sm text-gray-700">
                      <strong className={match.home_team_id === team.id ? "text-blue-600" : ""}>{match.home_team?.short_name}</strong>
                      {" "}{match.home_score} - {match.away_score}{" "}
                      <strong className={match.away_team_id === team.id ? "text-blue-600" : ""}>{match.away_team?.short_name}</strong>
                    </span>
                    <span className="text-xs text-gray-400 shrink-0">{new Date(match.scheduled_at).toLocaleDateString()}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historic archive — preserved without cluttering the active roster */}
      {(alumni.length > 0 || retired.length > 0) && (
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl">🏅</span>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-zinc-50">Hall of Fame &amp; Archive</h2>
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
              accent="from-zinc-500 to-zinc-700"
              players={retired}
            />
          </div>
        </div>
      )}
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
    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
      <div className={`bg-gradient-to-r ${accent} px-5 py-4 text-white`}>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-white/80 text-xs">{subtitle} · {players.length}</p>
      </div>
      <ul className="divide-y divide-gray-50 dark:divide-zinc-800 p-2">
        {players.map((player) => (
          <li key={player.id}>
            <Link
              href={`/player/${player.id}`}
              className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
            >
              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-zinc-300 shrink-0">
                #{player.jersey_number}
              </div>
              <span className="font-medium text-gray-700 dark:text-zinc-200">{player.name}</span>
              {player.position && (
                <span className="ml-auto text-xs bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 px-2 py-1 rounded shrink-0">
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
