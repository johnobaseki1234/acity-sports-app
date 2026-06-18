import { createClient } from "../../../lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

interface PlayerPageProps {
  params: Promise<{ id: string }>;
}

type PlayerEvent = {
  id: string;
  event_type: string;
  match_minute: number | null;
  created_at: string;
  match?: {
    id: string;
    scheduled_at: string;
    home_team?: { short_name: string | null } | null;
    away_team?: { short_name: string | null } | null;
  } | null;
};

const BASKETBALL_POINT_VALUES: Record<string, number> = {
  points_2: 2,
  points_3: 3,
  "2pt_made": 2,
  "3pt_made": 3,
  free_throw_made: 1,
};

export default async function PlayerProfilePage({ params }: PlayerPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select(`
      *,
      team:teams(*)
    `)
    .eq("id", id)
    .single();

  if (playerError || !player) {
    notFound();
  }

  const { data: events, error: eventsError } = await supabase
    .from("match_events")
    .select(`
      *,
      match:matches(
        id,
        scheduled_at,
        home_team:teams!matches_home_team_id_fkey(short_name),
        away_team:teams!matches_away_team_id_fkey(short_name)
      )
    `)
    .eq("player_id", id)
    .order("created_at", { ascending: false });

  if (eventsError) {
    throw new Error(`Unable to load player events: ${eventsError.message}`);
  }

  const playerEvents = (events ?? []) as PlayerEvent[];
  const stats = {
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    basketballPoints: 0,
    rebounds: 0,
    volleyballKills: 0,
    volleyballAces: 0,
  };

  playerEvents.forEach((event) => {
    if (event.event_type in BASKETBALL_POINT_VALUES) {
      stats.basketballPoints += BASKETBALL_POINT_VALUES[event.event_type];
      return;
    }

    switch (event.event_type) {
      case "goal":
      case "penalty_scored":
        stats.goals++;
        break;
      case "assist":
        stats.assists++;
        break;
      case "yellow_card":
        stats.yellowCards++;
        break;
      case "red_card":
        stats.redCards++;
        break;
      case "rebound":
        stats.rebounds++;
        break;
      case "kill":
        stats.volleyballKills++;
        break;
      case "ace":
        stats.volleyballAces++;
        break;
    }
  });

  const statCards = [
    { label: "Goals", value: stats.goals },
    { label: "Assists", value: stats.assists },
    { label: "Yellow Cards", value: stats.yellowCards },
    { label: "Red Cards", value: stats.redCards },
    { label: "Basketball Points", value: stats.basketballPoints },
    { label: "Rebounds", value: stats.rebounds },
    { label: "Volleyball Kills", value: stats.volleyballKills },
    { label: "Volleyball Aces", value: stats.volleyballAces },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {player.team && (
        <Link
          href={`/team/${player.team.slug}`}
          className="text-sm text-blue-600 hover:underline inline-flex items-center mb-6 font-medium"
        >
          Back to {player.team.name}
        </Link>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6 mb-8">
        {player.photo_url ? (
          <img
            src={player.photo_url}
            alt={player.name}
            className="w-28 h-28 object-cover rounded-full border-2 border-gray-100 bg-gray-50"
          />
        ) : (
          <div className="w-28 h-28 bg-gradient-to-tr from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-gray-400 text-4xl font-bold">
            #{player.jersey_number}
          </div>
        )}
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold text-gray-800">{player.name}</h1>
          <p className="text-gray-500 font-medium mt-1">
            {player.position || "Player"} {player.secondary_position ? ` / ${player.secondary_position}` : ""}
          </p>
          {player.team && (
            <span className="inline-block mt-3 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
              {player.team.name}
            </span>
          )}
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-4">Season Statistics</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
            <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Recent Events Log</h2>
        {playerEvents.length === 0 ? (
          <p className="text-gray-500 text-sm">No match actions logged for this player yet.</p>
        ) : (
          <div className="space-y-3">
            {playerEvents.map((event) => (
              <div key={event.id} className="p-3 border rounded-xl flex justify-between items-center bg-gray-50/50 text-sm">
                <div>
                  <span className="font-semibold text-blue-600 capitalize mr-2">{event.event_type.replaceAll("_", " ")}</span>
                  <span className="text-gray-400 font-mono text-xs">Minute {event.match_minute || "--"}</span>
                </div>
                <div className="text-gray-500 text-xs">
                  {event.match?.home_team?.short_name} vs {event.match?.away_team?.short_name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
