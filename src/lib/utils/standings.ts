import type { Match, Season, Standing, Team } from "@/lib/supabase/types";

type TeamStanding = Standing & {
  points_for: number;
  points_against: number;
};

export function computeStandings({
  teams,
  matches,
  season,
}: {
  teams: Team[];
  matches: Match[];
  season: Season;
}): TeamStanding[] {
  const config = season.standings_config;
  const table = new Map<string, TeamStanding>();

  for (const team of teams) {
    table.set(team.id, {
      season_id: season.id,
      team_id: team.id,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goals_for: 0,
      goals_against: 0,
      goal_diff: 0,
      points: 0,
      points_for: 0,
      points_against: 0,
      team,
    });
  }

  for (const match of matches.filter((m) => m.status === "finished")) {
    const home = table.get(match.home_team_id);
    const away = table.get(match.away_team_id);
    if (!home || !away) continue;

    applyResult(home, match.home_score, match.away_score, config);
    applyResult(away, match.away_score, match.home_score, config);
  }

  return [...table.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.won !== a.won) return b.won - a.won;
    if (b.goal_diff !== a.goal_diff) return b.goal_diff - a.goal_diff;
    if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
    return (a.team?.name ?? "").localeCompare(b.team?.name ?? "");
  });
}

function applyResult(
  row: TeamStanding,
  scoreFor: number,
  scoreAgainst: number,
  config: Season["standings_config"],
) {
  row.played += 1;
  row.goals_for += scoreFor;
  row.goals_against += scoreAgainst;
  row.points_for = row.goals_for;
  row.points_against = row.goals_against;
  row.goal_diff = row.goals_for - row.goals_against;

  if (scoreFor > scoreAgainst) {
    row.won += 1;
    row.points += config.points_win;
  } else if (scoreFor < scoreAgainst) {
    row.lost += 1;
    row.points += config.points_loss;
  } else {
    row.drawn += 1;
    row.points += config.points_draw;
  }
}
