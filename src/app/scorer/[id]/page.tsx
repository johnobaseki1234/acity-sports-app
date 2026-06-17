import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ScorerConsole } from "@/components/scorer/ScorerConsole";
import type { Match, Sport } from "@/lib/supabase/types";

export default async function ScorerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: match } = await supabase
    .from("matches")
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*),
      season:seasons(*, sport:sports(*))
    `)
    .eq("id", id)
    .single();

  if (!match) notFound();
  if (match.status === "finished" || match.status === "cancelled") {
    redirect("/admin");
  }

  const sport = match.season?.sport as Sport | undefined;
  if (!sport) notFound();

  const [{ data: homePlayers }, { data: awayPlayers }] = await Promise.all([
    supabase.from("players").select("*").eq("team_id", match.home_team_id).eq("is_active", true).order("jersey_number"),
    supabase.from("players").select("*").eq("team_id", match.away_team_id).eq("is_active", true).order("jersey_number"),
  ]);

  return (
    <ScorerConsole
      match={match as Match}
      sport={sport}
      homePlayers={homePlayers ?? []}
      awayPlayers={awayPlayers ?? []}
    />
  );
}
