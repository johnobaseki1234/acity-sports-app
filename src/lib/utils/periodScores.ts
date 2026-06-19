import type { MatchEvent } from "@/lib/supabase/types";

export type PeriodScore = {
  period: number;
  label: string;
  home: number;
  away: number;
};

export function computePeriodScores({
  events,
  scoringRules,
  homeTeamId,
  awayTeamId,
  periodCount,
  sportSlug,
}: {
  events: MatchEvent[];
  scoringRules: Record<string, number>;
  homeTeamId: string;
  awayTeamId: string;
  periodCount: number;
  sportSlug: string;
}): PeriodScore[] {
  const maxPeriod = events.reduce((max, e) => Math.max(max, e.period), periodCount);
  const scores = new Map<number, { home: number; away: number }>();

  for (let p = 1; p <= maxPeriod; p++) {
    scores.set(p, { home: 0, away: 0 });
  }

  for (const event of events) {
    const points = scoringRules[event.event_type];
    if (points == null) continue;

    const period = event.period ?? 1;
    const row = scores.get(period);
    if (!row) continue;

    if (event.team_id === homeTeamId) row.home += points;
    else if (event.team_id === awayTeamId) row.away += points;
  }

  return [...scores.entries()]
    .sort(([a], [b]) => a - b)
    .map(([period, { home, away }]) => ({
      period,
      label: periodLabel(sportSlug, period, periodCount),
      home,
      away,
    }));
}

function periodLabel(sportSlug: string, period: number, periodCount: number): string {
  if (sportSlug === "basketball") {
    if (period <= periodCount) return `Q${period}`;
    return period === periodCount + 1 ? "OT" : `OT${period - periodCount}`;
  }
  if (sportSlug === "football") return period === 1 ? "1H" : "2H";
  return `S${period}`;
}
