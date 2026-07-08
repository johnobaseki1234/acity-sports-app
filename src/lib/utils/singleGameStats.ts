import type { MatchEvent, Sport } from "@/lib/supabase/types";
import { ZONE_COUNT } from "@/lib/utils/courtZones";

export type SingleGameStats = {
  score: number;
  assists: number;
  blocks: number;
  steals: number;
  saves: number;
  fouls: number;
  // NCAA shooting splits — derived from the made/missed event pairs the
  // scorer console already logs (points_2/missed_2pt, points_3/missed_3pt,
  // free_throw_made/free_throw_missed). No schema change required.
  fgMade: number;
  fgAttempted: number;
  threeMade: number;
  threeAttempted: number;
  ftMade: number;
  ftAttempted: number;
  reboundsOff: number;
  reboundsDef: number;
  reboundsUnclassified: number; // legacy "rebound" events logged before the O/D split
};

export const FOUL_EVENT_TYPES = ["foul", "technical_foul", "yellow_card", "red_card"];

export const EMPTY_GAME_STATS: SingleGameStats = {
  score: 0,
  assists: 0,
  blocks: 0,
  steals: 0,
  saves: 0,
  fouls: 0,
  fgMade: 0,
  fgAttempted: 0,
  threeMade: 0,
  threeAttempted: 0,
  ftMade: 0,
  ftAttempted: 0,
  reboundsOff: 0,
  reboundsDef: 0,
  reboundsUnclassified: 0,
};

export function computeSingleGameStats(
  playerId: string,
  events: MatchEvent[],
  sport: Sport
): SingleGameStats {
  const stats: SingleGameStats = { ...EMPTY_GAME_STATS };

  for (const ev of events) {
    if (ev.assist_player_id === playerId) stats.assists++;
    if (ev.player_id !== playerId) continue;

    const config = sport.event_types.find((e) => e.type === ev.event_type);
    if (config?.affects_score && (config.score_value ?? 0) > 0) {
      stats.score += config.score_value ?? 0;
    }
    if (ev.event_type === "assist") stats.assists++;
    if (ev.event_type === "block") stats.blocks++;
    if (ev.event_type === "steal") stats.steals++;
    if (ev.event_type === "save") stats.saves++;
    if (FOUL_EVENT_TYPES.includes(ev.event_type)) stats.fouls++;

    switch (ev.event_type) {
      case "points_2":
        stats.fgMade++;
        stats.fgAttempted++;
        break;
      case "missed_2pt":
        stats.fgAttempted++;
        break;
      case "points_3":
        stats.fgMade++;
        stats.fgAttempted++;
        stats.threeMade++;
        stats.threeAttempted++;
        break;
      case "missed_3pt":
        stats.fgAttempted++;
        stats.threeAttempted++;
        break;
      case "free_throw_made":
        stats.ftMade++;
        stats.ftAttempted++;
        break;
      case "free_throw_missed":
        stats.ftAttempted++;
        break;
      case "rebound_offensive":
        stats.reboundsOff++;
        break;
      case "rebound_defensive":
        stats.reboundsDef++;
        break;
      case "rebound":
        stats.reboundsUnclassified++;
        break;
    }
  }

  return stats;
}

export function totalRebounds(stats: SingleGameStats): number {
  return stats.reboundsOff + stats.reboundsDef + stats.reboundsUnclassified;
}

export function pct(made: number, attempted: number): number {
  if (!attempted) return 0;
  return Math.round((made / attempted) * 1000) / 10;
}

/**
 * Real shot-zone telemetry for a player, aggregated from match_events whose
 * `details.zone` was captured live in the scorer console. Only counts shots
 * that carry real zone data — never fabricates a distribution.
 */
export type ZoneTally = { made: number; attempts: number };

/** Minimal event shape the zone reader needs — works for live match rows and season history alike. */
export type ZoneEvent = Pick<MatchEvent, "player_id" | "event_type" | "details">;

export function computeZoneTelemetry(
  playerId: string,
  events: readonly ZoneEvent[]
): ZoneTally[] {
  const tallies: ZoneTally[] = Array.from({ length: ZONE_COUNT }, () => ({ made: 0, attempts: 0 }));

  for (const ev of events) {
    if (ev.player_id !== playerId) continue;
    const zone = (ev.details as { zone?: number } | null)?.zone;
    if (zone === undefined || zone === null || zone < 0 || zone >= ZONE_COUNT) continue;

    if (ev.event_type === "points_2" || ev.event_type === "points_3") {
      tallies[zone].made++;
      tallies[zone].attempts++;
    } else if (ev.event_type === "missed_2pt" || ev.event_type === "missed_3pt") {
      tallies[zone].attempts++;
    }
  }

  return tallies;
}

export function hasRealZoneData(tallies: ZoneTally[]): boolean {
  return tallies.some((t) => t.attempts > 0);
}
