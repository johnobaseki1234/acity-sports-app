import { createClient } from "@/lib/supabase/server";
import { PlayerForm } from "@/components/admin/PlayerForm";
import type { Team } from "@/lib/supabase/types";

export default async function NewPlayerPage() {
  const supabase = await createClient();

  const [{ data: teamsData }, { data: sportsData }, { data: seasonsData }] = await Promise.all([
    supabase.from("teams").select("*").order("name"),
    supabase.from("sports").select("*").order("name"),
    supabase.from("seasons").select("id, sport_id, season_teams(team_id)"),
  ]);

  const teams = (teamsData ?? []) as Team[];

  // Build a map of team_id → sport_slug
  // A team's sport is determined by which season it belongs to
  const sportMap: Record<string, string> = {};
  const sportSlugById: Record<string, string> = {};
  (sportsData ?? []).forEach((s: { id: string; slug: string }) => { sportSlugById[s.id] = s.slug; });

  (seasonsData ?? []).forEach((season: { sport_id: string; season_teams: { team_id: string }[] }) => {
    const sportSlug = sportSlugById[season.sport_id];
    if (!sportSlug) return;
    (season.season_teams ?? []).forEach(({ team_id }: { team_id: string }) => {
      sportMap[team_id] = sportSlug;
    });
  });

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">New Player</h1>
      <PlayerForm
        teams={teams}
        sports={(sportsData ?? []) as { id: string; name: string; slug: string }[]}
        teamSportMap={sportMap}
      />
    </div>
  );
}
