import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { LiveMatchView } from "@/components/matches/LiveMatchView";
import type { Match, MatchEvent, Player, Sport } from "@/lib/supabase/types";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: match }, { data: events }] = await Promise.all([
    supabase
      .from("matches")
      .select(`*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*), season:seasons(*, sport:sports(*))`)
      .eq("id", id)
      .single(),
    supabase
      .from("match_events")
      .select("*, player:players!match_events_player_id_fkey(*), team:teams(*)")
      .eq("match_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!match) notFound();
  if (!match.season?.sport) notFound();

  const { data: roster } = await supabase
    .from("players")
    .select("*")
    .in("team_id", [match.home_team_id, match.away_team_id])
    .eq("is_active", true)
    .order("jersey_number", { ascending: true });

  return (
    <LiveMatchView
      match={match as Match}
      initialEvents={(events ?? []) as MatchEvent[]}
      sport={match.season.sport as Sport}
      roster={(roster ?? []) as Player[]}
    />
  );
}
