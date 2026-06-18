import { createClient } from "../../../lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PlayerStatsTabs, type SportStatBlock } from "./PlayerStatsTabs";

interface PlayerPageProps {
  params: Promise<{ id: string }>;
}

type RawEvent = {
  id: string;
  event_type: string;
  match_minute: number | null;
  created_at: string;
  match?: {
    id: string;
    home_team?: { short_name: string | null } | null;
    away_team?: { short_name: string | null } | null;
  } | null;
};

// Supabase widens to-one relations to arrays in its generated types — normalize.
function one<T>(value: T | T[] | null | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : value ?? undefined;
}

function aggregate(sportSlug: string, events: RawEvent[]): { label: string; value: number }[] {
  if (sportSlug === "basketball") {
    let points = 0, rebounds = 0, assists = 0, steals = 0, blocks = 0;
    for (const e of events) {
      switch (e.event_type) {
        case "points_2": points += 2; break;
        case "points_3": points += 3; break;
        case "free_throw_made": points += 1; break;
        case "rebound": rebounds++; break;
        case "assist": assists++; break;
        case "steal": steals++; break;
        case "block": blocks++; break;
      }
    }
    return [
      { label: "Points", value: points },
      { label: "Rebounds", value: rebounds },
      { label: "Assists", value: assists },
      { label: "Steals", value: steals },
      { label: "Blocks", value: blocks },
    ];
  }
  if (sportSlug === "football") {
    let goals = 0, assists = 0, yellow = 0, red = 0;
    for (const e of events) {
      switch (e.event_type) {
        case "goal":
        case "penalty_scored": goals++; break;
        case "assist": assists++; break;
        case "yellow_card": yellow++; break;
        case "red_card": red++; break;
      }
    }
    return [
      { label: "Goals", value: goals },
      { label: "Assists", value: assists },
      { label: "Yellow Cards", value: yellow },
      { label: "Red Cards", value: red },
    ];
  }
  if (sportSlug === "volleyball") {
    let kills = 0, aces = 0, blocks = 0, points = 0;
    for (const e of events) {
      switch (e.event_type) {
        case "kill": kills++; points++; break;
        case "ace": aces++; points++; break;
        case "block": blocks++; points++; break;
        case "point": points++; break;
      }
    }
    return [
      { label: "Points", value: points },
      { label: "Kills", value: kills },
      { label: "Aces", value: aces },
      { label: "Blocks", value: blocks },
    ];
  }
  return [];
}

const EVENT_SELECT = `
  id, event_type, match_minute, created_at,
  match:matches(
    id,
    home_team:teams!matches_home_team_id_fkey(short_name),
    away_team:teams!matches_away_team_id_fkey(short_name)
  )
`;

type SupabaseLike = Awaited<ReturnType<typeof createClient>>;

async function getTeamSport(
  supabase: SupabaseLike,
  teamId: string
): Promise<{ slug: string; name: string; icon: string } | null> {
  const { data } = await supabase
    .from("season_teams")
    .select("season:seasons(sport:sports(slug, name, icon))")
    .eq("team_id", teamId)
    .limit(1)
    .maybeSingle();
  const season = one(data?.season as { sport: unknown }[]);
  const sport = one(season?.sport as { slug: string; name: string; icon: string }[]);
  return sport ?? null;
}

export default async function PlayerProfilePage({ params }: PlayerPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("*, team:teams(*)")
    .eq("id", id)
    .single();

  if (playerError || !player) {
    notFound();
  }

  // Gather the set of player records that belong to this student. If an
  // athlete_key is set, all records sharing it are the same person.
  let records = [player];
  if (player.athlete_key) {
    const { data: linked } = await supabase
      .from("players")
      .select("*, team:teams(*)")
      .eq("athlete_key", player.athlete_key);
    if (linked && linked.length > 0) records = linked;
  }

  // Build one stat block per record's sport.
  const blocks: SportStatBlock[] = [];
  for (const rec of records) {
    const sport = await getTeamSport(supabase, rec.team_id);
    if (!sport) continue;

    const { data: events } = await supabase
      .from("match_events")
      .select(EVENT_SELECT)
      .eq("player_id", rec.id)
      .order("created_at", { ascending: false });

    const rawEvents = (events ?? []) as unknown as RawEvent[];
    blocks.push({
      sportSlug: sport.slug,
      sportName: sport.name,
      sportIcon: sport.icon,
      teamName: rec.team?.name ?? "",
      stats: aggregate(sport.slug, rawEvents),
      events: rawEvents.map((e) => ({
        id: e.id,
        label: e.event_type.replaceAll("_", " "),
        minute: e.match_minute,
        matchup: `${e.match?.home_team?.short_name ?? "?"} vs ${e.match?.away_team?.short_name ?? "?"}`,
      })),
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {player.team && (
        <Link
          href={`/team/${player.team.slug}`}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center mb-6 font-medium"
        >
          ← Back to {player.team.name}
        </Link>
      )}

      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6 mb-8">
        {player.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.photo_url}
            alt={player.name}
            className="w-28 h-28 object-cover rounded-full border-2 border-gray-100 dark:border-zinc-800 bg-gray-50"
          />
        ) : (
          <div className="w-28 h-28 bg-gradient-to-tr from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-700 rounded-full flex items-center justify-center text-gray-400 text-4xl font-bold">
            #{player.jersey_number}
          </div>
        )}
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-zinc-50">{player.name}</h1>
          <p className="text-gray-500 dark:text-zinc-400 font-medium mt-1">
            {player.position || "Player"}
            {player.secondary_position ? ` / ${player.secondary_position}` : ""}
          </p>
          {blocks.length > 1 && (
            <span className="inline-block mt-3 px-3 py-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
              Multi-sport athlete · {blocks.length} sports
            </span>
          )}
        </div>
      </div>

      <PlayerStatsTabs blocks={blocks} />
    </div>
  );
}
