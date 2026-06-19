import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ScorerConsole } from "@/components/scorer/ScorerConsole"; // Adjust path to your console component

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ScorerPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Fetch match metadata, associated teams, and seasons
  const { data: match } = await supabase
    .from("matches")
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*),
      season:seasons(*)
    `)
    .eq("id", id)
    .single();

  if (!match) {
    notFound();
  }

  // 2. Fetch the sport configurations and layout properties
  const { data: sport } = await supabase
    .from("sports")
    .select("*")
    .eq("id", match.sport_id)
    .single();

  if (!sport) {
    notFound();
  }

  // 3. Fetch players assigned to the home team roster
  const { data: homePlayers } = await supabase
    .from("players")
    .select("*")
    .eq("team_id", match.home_team_id);

  // 4. Fetch players assigned to the away team roster
  const { data: awayPlayers } = await supabase
    .from("players")
    .select("*")
    .eq("team_id", match.away_team_id);

  return (
    <ScorerConsole
      match={match}
      sport={sport}
      homePlayers={homePlayers ?? []}
      awayPlayers={awayPlayers ?? []}
    />
  );
}