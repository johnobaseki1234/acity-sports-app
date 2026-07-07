import type { Match, Standing, Team } from "@/lib/supabase/types";

export type BasketballRow = Standing & {
  team?: Team;
  winPct: number;
  gamesBehind: number;
  streak: { result: "W" | "L"; count: number } | null;
};

/**
 * NBA/NCAA-style enrichment over the shared points-based standings table:
 * win percentage, games behind the leader, and current streak. Draws don't
 * exist in basketball, so `row.drawn` is ignored here even if present.
 */
export function enrichBasketballStandings(
  table: (Standing & { team?: Team })[],
  matches: Match[]
): BasketballRow[] {
  const leader = table[0];

  return table.map((row) => {
    const winPct = row.played > 0 ? row.won / row.played : 0;
    const gamesBehind =
      !leader || leader.team_id === row.team_id
        ? 0
        : (leader.won - row.won + (row.lost - leader.lost)) / 2;

    const teamMatches = matches
      .filter(
        (m) =>
          m.status === "finished" &&
          (m.home_team_id === row.team_id || m.away_team_id === row.team_id)
      )
      .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

    let streak: BasketballRow["streak"] = null;
    for (const m of teamMatches) {
      const isHome = m.home_team_id === row.team_id;
      const us = isHome ? m.home_score : m.away_score;
      const them = isHome ? m.away_score : m.home_score;
      const result: "W" | "L" = us > them ? "W" : "L";
      if (!streak) {
        streak = { result, count: 1 };
      } else if (streak.result === result) {
        streak.count++;
      } else {
        break;
      }
    }

    return { ...row, winPct, gamesBehind, streak };
  });
}
