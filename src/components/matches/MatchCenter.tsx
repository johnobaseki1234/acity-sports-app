"use client";

import { useMemo } from "react";
import type { MatchEvent, Player, Sport, Team } from "@/lib/supabase/types";
import { computeSingleGameStats, totalRebounds, pct, EMPTY_GAME_STATS, type SingleGameStats } from "@/lib/utils/singleGameStats";

type Props = {
  homeTeam?: Team;
  awayTeam?: Team;
  homeRoster: Player[];
  awayRoster: Player[];
  events: MatchEvent[];
  sport: Sport;
};

const PAINT_ZONES = new Set([0, 1, 2, 3]); // Restricted Area, Right/Middle/Left Low Post

function sumTeam(roster: Player[], events: MatchEvent[], sport: Sport): SingleGameStats {
  const totals = { ...EMPTY_GAME_STATS };
  for (const player of roster) {
    const s = computeSingleGameStats(player.id, events, sport);
    (Object.keys(totals) as (keyof SingleGameStats)[]).forEach((k) => {
      totals[k] += s[k];
    });
  }
  return totals;
}

function pointsInPaint(roster: Player[], events: MatchEvent[], teamId?: string): number {
  const playerIds = new Set(roster.map((p) => p.id));
  let pts = 0;
  for (const ev of events) {
    if (ev.team_id !== teamId || !ev.player_id || !playerIds.has(ev.player_id)) continue;
    if (ev.event_type !== "points_2") continue;
    const zone = (ev.details as { zone?: number } | null)?.zone;
    if (zone !== undefined && zone !== null && PAINT_ZONES.has(zone)) pts += 2;
  }
  return pts;
}

function hasAnyZoneData(events: MatchEvent[]): boolean {
  return events.some((e) => {
    const zone = (e.details as { zone?: number } | null)?.zone;
    return zone !== undefined && zone !== null;
  });
}

export function MatchCenter({ homeTeam, awayTeam, homeRoster, awayRoster, events, sport }: Props) {
  const homeTotals = useMemo(() => sumTeam(homeRoster, events, sport), [homeRoster, events, sport]);
  const awayTotals = useMemo(() => sumTeam(awayRoster, events, sport), [awayRoster, events, sport]);

  if (sport.slug === "basketball") {
    const homeFg = pct(homeTotals.fgMade, homeTotals.fgAttempted);
    const awayFg = pct(awayTotals.fgMade, awayTotals.fgAttempted);
    const home3p = pct(homeTotals.threeMade, homeTotals.threeAttempted);
    const away3p = pct(awayTotals.threeMade, awayTotals.threeAttempted);
    const homeFt = pct(homeTotals.ftMade, homeTotals.ftAttempted);
    const awayFt = pct(awayTotals.ftMade, awayTotals.ftAttempted);
    const zoneDataExists = hasAnyZoneData(events);
    const homePaint = zoneDataExists ? pointsInPaint(homeRoster, events, homeTeam?.id) : null;
    const awayPaint = zoneDataExists ? pointsInPaint(awayRoster, events, awayTeam?.id) : null;

    return (
      <TeamCenterShell homeTeam={homeTeam} awayTeam={awayTeam}>
        <StatBar label="FG%" home={homeFg} away={awayFg} format="pct" />
        <StatBar label="3PT%" home={home3p} away={away3p} format="pct" />
        <StatBar label="FT%" home={homeFt} away={awayFt} format="pct" />
        <StatBar label="Total Rebounds" home={totalRebounds(homeTotals)} away={totalRebounds(awayTotals)} />
        <StatBar label="Assists" home={homeTotals.assists} away={awayTotals.assists} />
        {homePaint !== null && awayPaint !== null && (
          <StatBar label="Points in the Paint" home={homePaint} away={awayPaint} />
        )}
      </TeamCenterShell>
    );
  }

  if (sport.slug === "football") {
    return (
      <TeamCenterShell homeTeam={homeTeam} awayTeam={awayTeam}>
        <StatBar label="Goals" home={homeTotals.score} away={awayTotals.score} />
        <StatBar label="Assists" home={homeTotals.assists} away={awayTotals.assists} />
        <StatBar label="Shots on Target" home={homeTotals.shotsOnTarget} away={awayTotals.shotsOnTarget} />
        <StatBar label="Saves" home={homeTotals.saves} away={awayTotals.saves} />
        <StatBar label="Fouls" home={homeTotals.fouls} away={awayTotals.fouls} invert />
      </TeamCenterShell>
    );
  }

  // Volleyball
  return (
    <TeamCenterShell homeTeam={homeTeam} awayTeam={awayTeam}>
      <StatBar label="Points" home={homeTotals.score} away={awayTotals.score} />
      <StatBar label="Blocks" home={homeTotals.blocks} away={awayTotals.blocks} />
    </TeamCenterShell>
  );
}

function TeamCenterShell({
  homeTeam,
  awayTeam,
  children,
}: {
  homeTeam?: Team;
  awayTeam?: Team;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/70 backdrop-blur-xl p-5 space-y-5">
      <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider">
        <span className="text-white truncate">{homeTeam?.short_name ?? "Home"}</span>
        <span className="text-zinc-600">Team Comparison</span>
        <span className="text-white truncate">{awayTeam?.short_name ?? "Away"}</span>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

/** Horizontal dual-bar comparison: volt for the leading side, crimson-tinted for trailing. */
function StatBar({
  label,
  home,
  away,
  format = "num",
  invert = false,
}: {
  label: string;
  home: number;
  away: number;
  format?: "num" | "pct";
  /** For stats where lower is better (fouls) — dims the leader logic. */
  invert?: boolean;
}) {
  const total = home + away;
  const homePct = total > 0 ? (home / total) * 100 : 50;
  const awayPct = 100 - homePct;
  const homeWins = invert ? home < away : home > away;
  const awayWins = invert ? away < home : away > home;

  const fmt = (v: number) => (format === "pct" ? `${v}%` : v.toString());

  return (
    <div>
      <div className="flex items-center justify-between text-xs font-bold mb-1.5">
        <span className={homeWins ? "text-vanguard-volt" : "text-zinc-300"}>{fmt(home)}</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</span>
        <span className={awayWins ? "text-vanguard-volt" : "text-zinc-300"}>{fmt(away)}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-white/5">
        <div
          className={`transition-all ${homeWins ? "bg-vanguard-volt" : "bg-zinc-600"}`}
          style={{ width: `${homePct}%` }}
        />
        <div className="w-px bg-vanguard-charcoal" />
        <div
          className={`ml-auto transition-all ${awayWins ? "bg-vanguard-volt" : "bg-zinc-600"}`}
          style={{ width: `${awayPct}%` }}
        />
      </div>
    </div>
  );
}
