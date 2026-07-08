import { createClient } from "../../../lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, Award, Activity } from "lucide-react";
import { PlayerStatsTabs, type SportStatBlock } from "./PlayerStatsTabs";

interface PlayerPageProps {
  params: Promise<{ id: string }>;
}

type RawEvent = {
  id: string;
  event_type: string;
  match_minute: number | null;
  created_at: string;
  details: Record<string, unknown> | null;
  match?: {
    id: string;
    home_team?: { short_name: string | null } | null;
    away_team?: { short_name: string | null } | null;
  } | null;
};

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
        case "rebound":
        case "rebound_offensive":
        case "rebound_defensive": rebounds++; break;
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
        case "block": blocks++; block_point: points++; break; // combined tally
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
  id, event_type, match_minute, created_at, details,
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

  let records = [player];
  if (player.athlete_key) {
    const { data: linked } = await supabase
      .from("players")
      .select("*, team:teams(*)")
      .eq("athlete_key", player.athlete_key);
    if (linked && linked.length > 0) records = linked;
  }

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
      playerId: rec.id,
      stats: aggregate(sport.slug, rawEvents),
      // Season-long zone telemetry for the shot map (all this player's shots).
      zoneEvents: rawEvents.map((e) => ({
        player_id: rec.id,
        event_type: e.event_type,
        details: e.details,
      })),
      events: rawEvents.map((e) => ({
        id: e.id,
        label: e.event_type.replaceAll("_", " "),
        minute: e.match_minute,
        matchup: `${e.match?.home_team?.short_name ?? "?"} vs ${e.match?.away_team?.short_name ?? "?"}`,
      })),
    });
  }

  return (
    <div className="min-h-screen bg-vanguard-charcoal text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Navigation Link Wire */}
        {player.team && (
          <Link
            href={`/team/${player.team.slug}`}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-vanguard-volt transition-colors"
          >
            <ArrowLeft className="h-4 w-4 stroke-[2.5]" /> Back to {player.team.name}
          </Link>
        )}

        {/* Premium Profile Info Header Panel */}
        <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-vanguard-volt to-vanguard-crimson" />

          <div className="flex items-center gap-5">
            {player.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={player.photo_url}
                alt={player.name}
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl border-2 border-white/10 bg-zinc-800"
              />
            ) : (
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center font-black text-2xl text-white tracking-tighter">
                #{player.jersey_number ?? "00"}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight text-white uppercase">
                  {player.name}
                </h1>
                {blocks.length > 1 && (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-vanguard-volt/10 text-vanguard-volt px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Trophy className="h-2.5 w-2.5" /> Multi-Sport
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-400 mt-1 font-medium">
                {player.team?.name || "Independent"} · <span className="text-vanguard-volt font-semibold">{player.position || "Athlete"}</span>
                {player.secondary_position ? ` / ${player.secondary_position}` : ""}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3 bg-black/30 border border-white/10 px-4 py-3 rounded-xl">
            <Award className="h-5 w-5 text-vanguard-volt" />
            <div>
              <span className="block text-[9px] font-black text-zinc-500 uppercase tracking-wider">Status Standing</span>
              <span className="text-xs font-bold text-zinc-200">Active Roster Engine</span>
            </div>
          </div>
        </div>

        {/* Dynamic Presentation Component Tabs Area */}
        <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
            <Activity className="h-4 w-4 text-vanguard-volt" />
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500">
              Aggregated Metrics & Historical Events Log
            </h3>
          </div>
          <PlayerStatsTabs blocks={blocks} />
        </div>

      </div>
    </div>
  );
}