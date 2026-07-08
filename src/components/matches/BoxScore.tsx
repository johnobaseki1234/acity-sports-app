"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { MatchEvent, Player, Sport, Team } from "@/lib/supabase/types";
import {
  computeSingleGameStats,
  totalRebounds,
  pct,
  type SingleGameStats,
} from "@/lib/utils/singleGameStats";

type Props = {
  homeTeam?: Team;
  awayTeam?: Team;
  homeRoster: Player[];
  awayRoster: Player[];
  events: MatchEvent[];
  sport: Sport;
  /** Enables "back to Box Score" routing when a player name is clicked. */
  matchId?: string;
};

type Row = { player: Player; stats: SingleGameStats };

export function BoxScore({
  homeTeam,
  awayTeam,
  homeRoster,
  awayRoster,
  events,
  sport,
  matchId,
}: Props) {
  const isBasketball = sport.slug === "basketball";
  const isFootball = sport.slug === "football";

  const buildRows = (roster: Player[]): Row[] =>
    roster
      .map((player) => ({ player, stats: computeSingleGameStats(player.id, events, sport) }))
      .sort(
        (a, b) =>
          b.stats.score - a.stats.score ||
          b.stats.assists - a.stats.assists ||
          a.player.jersey_number - b.player.jersey_number
      );

  const homeRows = useMemo(() => buildRows(homeRoster), [homeRoster, events, sport]);
  const awayRows = useMemo(() => buildRows(awayRoster), [awayRoster, events, sport]);

  if (isBasketball) {
    return (
      <div className="space-y-4">
        <NcaaTeamGrid teamName={homeTeam?.name ?? "Home"} rows={homeRows} matchId={matchId} />
        <NcaaTeamGrid teamName={awayTeam?.name ?? "Away"} rows={awayRows} matchId={matchId} />
      </div>
    );
  }

  if (isFootball) {
    const matchMinutes = (sport.periods.duration_minutes ?? 45) * sport.periods.count;
    return (
      <div className="space-y-4">
        <FootballTeamGrid teamName={homeTeam?.name ?? "Home"} rows={homeRows} matchMinutes={matchMinutes} matchId={matchId} />
        <FootballTeamGrid teamName={awayTeam?.name ?? "Away"} rows={awayRows} matchMinutes={matchMinutes} matchId={matchId} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TeamGrid teamName={homeTeam?.name ?? "Home"} rows={homeRows} matchId={matchId} />
      <TeamGrid teamName={awayTeam?.name ?? "Away"} rows={awayRows} matchId={matchId} />
    </div>
  );
}

/** Player name cell that routes to the player's profile hub, remembering the box score to return to. */
function PlayerNameCell({ player, matchId }: { player: Player; matchId?: string }) {
  const href = matchId ? `/player/${player.id}?fromMatch=${matchId}` : `/player/${player.id}`;
  return (
    <Link
      href={href}
      className="group/pl flex items-center gap-2 text-left w-full transition-all active:scale-[0.98] hover:opacity-100 opacity-95"
    >
      <span className="grid place-items-center h-6 w-6 shrink-0 rounded-md bg-white/10 text-[10px] font-bold tabular-nums text-zinc-400">
        {player.jersey_number}
      </span>
      <span className="font-semibold text-zinc-100 truncate group-hover/pl:text-vanguard-volt transition-colors">
        {player.name}
      </span>
    </Link>
  );
}

/** NCAA-style efficiency sheet: FG/FGA, 3PT/3PTA, FT/FTA, OREB-DREB splits. */
function NcaaTeamGrid({
  teamName,
  rows,
  matchId,
}: {
  teamName: string;
  rows: Row[];
  matchId?: string;
}) {
  if (rows.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/70 overflow-hidden">
      <h3 className="text-sm font-black text-zinc-200 px-4 pt-4 pb-2">{teamName}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[560px]">
          <thead>
            <tr className="text-[9px] font-black uppercase tracking-wider text-zinc-500 border-b border-white/10">
              <th className="text-left font-black pl-4 pr-2 py-2">Player</th>
              <th className="text-right font-black px-1.5 py-2 w-10">PTS</th>
              <th className="text-right font-black px-1.5 py-2 w-14">FG</th>
              <th className="text-right font-black px-1.5 py-2 w-10">FG%</th>
              <th className="text-right font-black px-1.5 py-2 w-14">3PT</th>
              <th className="text-right font-black px-1.5 py-2 w-10">3P%</th>
              <th className="text-right font-black px-1.5 py-2 w-14">FT</th>
              <th className="text-right font-black px-1.5 py-2 w-10">FT%</th>
              <th className="text-right font-black px-1.5 py-2 w-14">OREB-DREB</th>
              <th className="text-right font-black px-1.5 py-2 w-10">AST</th>
              <th className="text-right font-black px-1.5 py-2 w-10">STL</th>
              <th className="text-right font-black px-1.5 py-2 w-10">BLK</th>
              <th className="text-right font-black pl-1.5 pr-4 py-2 w-10">PF</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ player, stats }) => {
              const fgPct = pct(stats.fgMade, stats.fgAttempted);
              const threePct = pct(stats.threeMade, stats.threeAttempted);
              const ftPct = pct(stats.ftMade, stats.ftAttempted);
              return (
                <tr
                  key={player.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.04] transition-colors"
                >
                  <td className="pl-4 pr-2 py-2">
                    <PlayerNameCell player={player} matchId={matchId} />
                  </td>
                  <td className={`text-right px-1.5 py-2 tabular-nums font-black ${stats.score > 0 ? "text-vanguard-volt" : "text-zinc-600"}`}>
                    {stats.score}
                  </td>
                  <td className="text-right px-1.5 py-2 tabular-nums text-zinc-300">
                    {stats.fgMade}-{stats.fgAttempted}
                  </td>
                  <td className="text-right px-1.5 py-2 tabular-nums text-zinc-500">{fgPct}</td>
                  <td className="text-right px-1.5 py-2 tabular-nums text-zinc-300">
                    {stats.threeMade}-{stats.threeAttempted}
                  </td>
                  <td className="text-right px-1.5 py-2 tabular-nums text-zinc-500">{threePct}</td>
                  <td className="text-right px-1.5 py-2 tabular-nums text-zinc-300">
                    {stats.ftMade}-{stats.ftAttempted}
                  </td>
                  <td className="text-right px-1.5 py-2 tabular-nums text-zinc-500">{ftPct}</td>
                  <td className="text-right px-1.5 py-2 tabular-nums text-zinc-300">
                    {stats.reboundsOff}-{stats.reboundsDef}
                    {stats.reboundsUnclassified > 0 && (
                      <span className="text-zinc-600"> (+{stats.reboundsUnclassified})</span>
                    )}
                  </td>
                  <td className="text-right px-1.5 py-2 tabular-nums text-zinc-300">{stats.assists}</td>
                  <td className="text-right px-1.5 py-2 tabular-nums text-zinc-300">{stats.steals}</td>
                  <td className="text-right px-1.5 py-2 tabular-nums text-zinc-300">{stats.blocks}</td>
                  <td className={`text-right pl-1.5 pr-4 py-2 tabular-nums font-bold ${stats.fouls > 0 ? "text-vanguard-crimson" : "text-zinc-600"}`}>
                    {stats.fouls}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="px-4 pb-3 pt-1 text-[9px] font-semibold text-zinc-600">
        Totals: {rows.reduce((s, r) => s + totalRebounds(r.stats), 0)} REB combined this game
      </p>
    </div>
  );
}

/** ACFL match box score: MIN, G, A, S/SOT, TK, INT, SV. */
function FootballTeamGrid({
  teamName,
  rows,
  matchMinutes,
  matchId,
}: {
  teamName: string;
  rows: Row[];
  matchMinutes: number;
  matchId?: string;
}) {
  if (rows.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/70 overflow-hidden">
      <h3 className="text-sm font-black text-zinc-200 px-4 pt-4 pb-2">{teamName}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[520px]">
          <thead>
            <tr className="text-[9px] font-black uppercase tracking-wider text-zinc-500 border-b border-white/10">
              <th className="text-left font-black pl-4 pr-2 py-2">Player</th>
              <th className="text-right font-black px-1.5 py-2 w-12">MIN</th>
              <th className="text-right font-black px-1.5 py-2 w-10">G</th>
              <th className="text-right font-black px-1.5 py-2 w-10">A</th>
              <th className="text-right font-black px-1.5 py-2 w-14">S/SOT</th>
              <th className="text-right font-black px-1.5 py-2 w-10">TK</th>
              <th className="text-right font-black px-1.5 py-2 w-10">INT</th>
              <th className="text-right font-black pl-1.5 pr-4 py-2 w-10">SV</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ player, stats }) => {
              // No substitution in/out tracking yet — a rostered player who
              // logged any action is credited the full match length.
              const involved =
                stats.score > 0 || stats.assists > 0 || stats.shots > 0 || stats.tackles > 0 ||
                stats.interceptions > 0 || stats.saves > 0 || stats.fouls > 0;
              return (
                <tr
                  key={player.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.04] transition-colors"
                >
                  <td className="pl-4 pr-2 py-2">
                    <PlayerNameCell player={player} matchId={matchId} />
                  </td>
                  <td className="text-right px-1.5 py-2 tabular-nums text-zinc-400">
                    {involved ? `${matchMinutes}'` : "—"}
                  </td>
                  <td className={`text-right px-1.5 py-2 tabular-nums font-black ${stats.score > 0 ? "text-vanguard-volt" : "text-zinc-600"}`}>
                    {stats.score}
                  </td>
                  <td className="text-right px-1.5 py-2 tabular-nums text-zinc-300">{stats.assists}</td>
                  <td className="text-right px-1.5 py-2 tabular-nums text-zinc-300">
                    {stats.shots}/{stats.shotsOnTarget}
                  </td>
                  <td className="text-right px-1.5 py-2 tabular-nums text-zinc-300">{stats.tackles}</td>
                  <td className="text-right px-1.5 py-2 tabular-nums text-zinc-300">{stats.interceptions}</td>
                  <td className="text-right pl-1.5 pr-4 py-2 tabular-nums text-zinc-300">{stats.saves}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TeamGrid({
  teamName,
  rows,
  matchId,
}: {
  teamName: string;
  rows: Row[];
  matchId?: string;
}) {
  if (rows.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/70 overflow-hidden">
      <h3 className="text-sm font-black text-zinc-200 px-4 pt-4 pb-2">{teamName}</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] font-black uppercase tracking-wider text-zinc-500 border-b border-white/10">
            <th className="text-left font-black pl-4 pr-2 py-2">Player</th>
            <th className="text-right font-black px-2 py-2 w-12">PTS</th>
            <th className="text-right font-black px-2 py-2 w-12">AST</th>
            <th className="text-right font-black px-2 py-2 w-12">BLK</th>
            <th className="text-right font-black pl-2 pr-4 py-2 w-12">FLS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ player, stats }) => (
            <tr
              key={player.id}
              className="border-b border-white/5 last:border-0 hover:bg-white/[0.04] transition-colors"
            >
              <td className="pl-4 pr-2 py-2">
                <PlayerNameCell player={player} matchId={matchId} />
              </td>
              <td className={`text-right px-2 py-2 tabular-nums font-bold ${stats.score > 0 ? "text-vanguard-volt" : "text-zinc-600"}`}>
                {stats.score}
              </td>
              <td className={`text-right px-2 py-2 tabular-nums font-semibold ${stats.assists > 0 ? "text-zinc-100" : "text-zinc-600"}`}>
                {stats.assists}
              </td>
              <td className={`text-right px-2 py-2 tabular-nums font-semibold ${stats.blocks > 0 ? "text-zinc-100" : "text-zinc-600"}`}>
                {stats.blocks}
              </td>
              <td className={`text-right pl-2 pr-4 py-2 tabular-nums font-bold ${stats.fouls > 0 ? "text-vanguard-crimson" : "text-zinc-600"}`}>
                {stats.fouls}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
