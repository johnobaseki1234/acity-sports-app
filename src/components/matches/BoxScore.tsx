"use client";

import { useMemo } from "react";
import type { MatchEvent, Player, Sport, Team } from "@/lib/supabase/types";
import { computeSingleGameStats, type SingleGameStats } from "@/lib/utils/singleGameStats";

type Props = {
  homeTeam?: Team;
  awayTeam?: Team;
  homeRoster: Player[];
  awayRoster: Player[];
  events: MatchEvent[];
  sport: Sport;
  onSelectPlayer: (p: Player) => void;
};

type Row = { player: Player; stats: SingleGameStats };

export function BoxScore({
  homeTeam,
  awayTeam,
  homeRoster,
  awayRoster,
  events,
  sport,
  onSelectPlayer,
}: Props) {
  const scoreLabel = sport.slug === "football" ? "GLS" : "PTS";
  const defenseLabel = sport.slug === "football" ? "SAV" : "BLK";

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

  return (
    <div className="space-y-4">
      <TeamGrid
        teamName={homeTeam?.name ?? "Home"}
        rows={homeRows}
        scoreLabel={scoreLabel}
        defenseLabel={defenseLabel}
        sportSlug={sport.slug}
        onSelectPlayer={onSelectPlayer}
      />
      <TeamGrid
        teamName={awayTeam?.name ?? "Away"}
        rows={awayRows}
        scoreLabel={scoreLabel}
        defenseLabel={defenseLabel}
        sportSlug={sport.slug}
        onSelectPlayer={onSelectPlayer}
      />
    </div>
  );
}

function TeamGrid({
  teamName,
  rows,
  scoreLabel,
  defenseLabel,
  sportSlug,
  onSelectPlayer,
}: {
  teamName: string;
  rows: Row[];
  scoreLabel: string;
  defenseLabel: string;
  sportSlug: Sport["slug"];
  onSelectPlayer: (p: Player) => void;
}) {
  if (rows.length === 0) return null;

  return (
    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl shadow-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-200 px-4 pt-4 pb-2">
        {teamName}
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800">
            <th className="text-left font-bold pl-4 pr-2 py-2">Player</th>
            <th className="text-right font-bold px-2 py-2 w-12">{scoreLabel}</th>
            <th className="text-right font-bold px-2 py-2 w-12">AST</th>
            <th className="text-right font-bold px-2 py-2 w-12">{defenseLabel}</th>
            <th className="text-right font-bold pl-2 pr-4 py-2 w-12">FLS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ player, stats }) => {
            const defense = sportSlug === "football" ? stats.saves : stats.blocks;
            return (
              <tr
                key={player.id}
                className="border-b border-zinc-50 dark:border-zinc-800/60 last:border-0 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors"
              >
                <td className="pl-4 pr-2 py-2">
                  <button
                    onClick={() => onSelectPlayer(player)}
                    className="flex items-center gap-2 text-left w-full active:scale-[0.98] transition"
                  >
                    <span className="grid place-items-center h-6 w-6 shrink-0 rounded-md bg-zinc-100 dark:bg-white/10 text-[10px] font-bold tabular-nums text-zinc-500 dark:text-zinc-400">
                      {player.jersey_number}
                    </span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-100 truncate">
                      {player.name}
                    </span>
                  </button>
                </td>
                <td
                  className={`text-right px-2 py-2 tabular-nums font-bold ${
                    stats.score > 0 ? "text-vanguard-volt" : "text-zinc-400 dark:text-zinc-600"
                  }`}
                >
                  {stats.score}
                </td>
                <td
                  className={`text-right px-2 py-2 tabular-nums font-semibold ${
                    stats.assists > 0
                      ? "text-zinc-800 dark:text-zinc-100"
                      : "text-zinc-400 dark:text-zinc-600"
                  }`}
                >
                  {stats.assists}
                </td>
                <td
                  className={`text-right px-2 py-2 tabular-nums font-semibold ${
                    defense > 0
                      ? "text-zinc-800 dark:text-zinc-100"
                      : "text-zinc-400 dark:text-zinc-600"
                  }`}
                >
                  {defense}
                </td>
                <td
                  className={`text-right pl-2 pr-4 py-2 tabular-nums font-bold ${
                    stats.fouls > 0 ? "text-vanguard-crimson" : "text-zinc-400 dark:text-zinc-600"
                  }`}
                >
                  {stats.fouls}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
