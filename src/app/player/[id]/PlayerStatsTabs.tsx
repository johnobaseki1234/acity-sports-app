"use client";

import { useState } from "react";
import { SportIcon } from "@/components/ui/SportIcon";
import { ShotDistribution } from "@/components/matches/ShotDistribution";
import type { ZoneEvent } from "@/lib/utils/singleGameStats";

export type SportStatBlock = {
  sportSlug: string;
  sportName: string;
  sportIcon: string;
  teamName: string;
  playerId: string;
  stats: { label: string; value: number }[];
  zoneEvents: ZoneEvent[];
  events: { id: string; label: string; minute: number | null; matchup: string }[];
};

export function PlayerStatsTabs({ blocks }: { blocks: SportStatBlock[] }) {
  const [active, setActive] = useState(0);

  if (blocks.length === 0) {
    return (
      <p className="text-zinc-400 text-sm text-center py-10">
        No league or match data for this player yet.
      </p>
    );
  }

  const block = blocks[active] ?? blocks[0];

  return (
    <div>
      {/* Tabs — only shown for multi-sport athletes */}
      {blocks.length > 1 && (
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {blocks.map((b, i) => (
            <button
              key={b.sportSlug + i}
              onClick={() => setActive(i)}
              className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                i === active
                  ? "bg-vanguard-volt text-black"
                  : "bg-white/5 text-zinc-300 hover:bg-white/10"
              }`}
            >
              <SportIcon slug={b.sportSlug} className="h-4 w-4" /> {b.sportName}
            </button>
          ))}
        </div>
      )}

      <h2 className="flex items-center gap-2 text-xl font-bold text-white mb-1">
        <SportIcon slug={block.sportSlug} className="h-5 w-5 text-vanguard-volt" /> {block.sportName} Statistics
      </h2>
      {block.teamName && (
        <p className="text-sm text-zinc-500 mb-4">{block.teamName}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        {block.stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white/5 p-4 rounded-xl text-center border border-white/10"
          >
            <div className="text-2xl font-black text-white tabular-nums">{stat.value}</div>
            <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Season-long shot telemetry — aggregated across every logged game */}
      {block.sportSlug === "basketball" && (
        <div className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
            Season Shot Chart
          </p>
          <ShotDistribution playerId={block.playerId} events={block.zoneEvents} />
        </div>
      )}

      <div className="bg-zinc-900/70 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4 text-white border-b border-white/10 pb-2">
          Recent Events
        </h3>
        {block.events.length === 0 ? (
          <p className="text-zinc-400 text-sm">No match actions logged for this sport yet.</p>
        ) : (
          <div className="space-y-3">
            {block.events.map((event) => (
              <div
                key={event.id}
                className="p-3 border border-white/10 rounded-xl flex justify-between items-center bg-white/[0.03] text-sm"
              >
                <div>
                  <span className="font-semibold text-vanguard-volt capitalize mr-2">{event.label}</span>
                  {event.minute != null && (
                    <span className="text-zinc-500 font-mono text-xs">Minute {event.minute}</span>
                  )}
                </div>
                <div className="text-zinc-400 text-xs">{event.matchup}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
