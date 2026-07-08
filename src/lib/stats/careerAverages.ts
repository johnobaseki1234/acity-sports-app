import { createClient } from "@/lib/supabase/client";
import { calculatePPG, calculateRPG, calculateAPG, calculateFGPercent } from "@/lib/stats/basketball";
import { calculateGPG, calculateAPG as calculateFootballAPG, calculateSPG } from "@/lib/stats/football";

export type CareerAverages = {
  gamesPlayed: number;
  lines: { label: string; value: number }[];
};

export type CareerTotals = {
  goals?: number | null;
  assists?: number | null;
  saves?: number | null;
  two_pointers_made?: number | null;
  three_pointers_made?: number | null;
  free_throws_made?: number | null;
  rebounds?: number | null;
  steals?: number | null;
  blocks?: number | null;
};

/** Pure calculation — usable from both server and client contexts. */
export function computeCareerAverages(
  totals: CareerTotals | undefined,
  games: number,
  sportSlug: string
): CareerAverages | null {
  if (!totals || games === 0) return null;

  if (sportSlug === "basketball") {
    const totalPoints =
      (totals.two_pointers_made ?? 0) * 2 +
      (totals.three_pointers_made ?? 0) * 3 +
      (totals.free_throws_made ?? 0);
    return {
      gamesPlayed: games,
      lines: [
        { label: "PPG", value: calculatePPG(totalPoints, games) },
        { label: "RPG", value: calculateRPG(totals.rebounds ?? 0, games) },
        { label: "APG", value: calculateAPG(totals.assists ?? 0, games) },
        { label: "BPG", value: calculateRPG(totals.blocks ?? 0, games) },
        { label: "SPG", value: calculateRPG(totals.steals ?? 0, games) },
      ],
    };
  }

  return {
    gamesPlayed: games,
    lines: [
      { label: "GPG", value: calculateGPG(totals.goals ?? 0, games) },
      { label: "APG", value: calculateFootballAPG(totals.assists ?? 0, games) },
      { label: "SPG", value: calculateSPG(totals.saves ?? 0, games) },
    ],
  };
}

/**
 * Season career averages for a player, derived from the `player_stats` view
 * (season totals) divided by `player_game_counts` (distinct finished
 * matches from match_events). Returns null if the player has no games yet.
 */
export async function fetchCareerAverages(
  playerId: string,
  sportSlug: string
): Promise<CareerAverages | null> {
  const supabase = createClient();

  const [{ data: totals }, { data: gameCount }] = await Promise.all([
    supabase.from("player_stats").select("*").eq("player_id", playerId).maybeSingle(),
    supabase.from("player_game_counts").select("games_played").eq("player_id", playerId).maybeSingle(),
  ]);

  return computeCareerAverages(totals ?? undefined, gameCount?.games_played ?? 0, sportSlug);
}

export { calculateFGPercent };
