import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PlayerForm } from "@/components/admin/PlayerForm";
import type { Player, Team } from "@/lib/supabase/types";

export default async function EditPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: player }, { data: teamsData }, { data: sportsData }, { data: seasonsData }] = await Promise.all([
    supabase.from("players").select("*").eq("id", id).single(),
    supabase.from("teams").select("*").order("name"),
    supabase.from("sports").select("*").order("name"),
    supabase.from("seasons").select("id, sport_id, season_teams(team_id)"),
  ]);

  if (!player) notFound();

  const sportSlugById: Record<string, string> = {};
  (sportsData ?? []).forEach((s: { id: string; slug: string }) => { sportSlugById[s.id] = s.slug; });

  const sportMap: Record<string, string> = {};
  (seasonsData ?? []).forEach((season: { sport_id: string; season_teams: { team_id: string }[] }) => {
    const sportSlug = sportSlugById[season.sport_id];
    if (!sportSlug) return;
    (season.season_teams ?? []).forEach(({ team_id }: { team_id: string }) => {
      sportMap[team_id] = sportSlug;
    });
  });

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Edit Player</h1>
      <PlayerForm
        player={player as Player}
        teams={(teamsData ?? []) as Team[]}
        sports={(sportsData ?? []) as { id: string; name: string; slug: string }[]}
        teamSportMap={sportMap}
      />
    </div>
  );
}
