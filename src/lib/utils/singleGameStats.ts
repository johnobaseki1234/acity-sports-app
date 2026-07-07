import type { MatchEvent, Sport } from "@/lib/supabase/types";

export type SingleGameStats = {
  score: number;
  assists: number;
  blocks: number;
  saves: number;
  fouls: number;
};

export const FOUL_EVENT_TYPES = ["foul", "technical_foul", "yellow_card", "red_card"];

export function computeSingleGameStats(
  playerId: string,
  events: MatchEvent[],
  sport: Sport
): SingleGameStats {
  const stats: SingleGameStats = { score: 0, assists: 0, blocks: 0, saves: 0, fouls: 0 };

  for (const ev of events) {
    if (ev.assist_player_id === playerId) stats.assists++;
    if (ev.player_id !== playerId) continue;

    const config = sport.event_types.find((e) => e.type === ev.event_type);
    if (config?.affects_score && (config.score_value ?? 0) > 0) {
      stats.score += config.score_value ?? 0;
    }
    if (ev.event_type === "assist") stats.assists++;
    if (ev.event_type === "block") stats.blocks++;
    if (ev.event_type === "save") stats.saves++;
    if (FOUL_EVENT_TYPES.includes(ev.event_type)) stats.fouls++;
  }

  return stats;
}
