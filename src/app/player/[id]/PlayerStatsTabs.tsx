"use client";

import { useState } from "react";

export type SportStatBlock = {
  sportSlug: string;
  sportName: string;
  sportIcon: string;
  teamName: string;
  stats: { label: string; value: number }[];
  events: { id: string; label: string; minute: number | null; matchup: string }[];
};

export function PlayerStatsTabs({ blocks }: { blocks: SportStatBlock[] }) {
  const [active, setActive] = useState(0);

  if (blocks.length === 0) {
    return (
      <p className="text-gray-500 dark:text-zinc-400 text-sm text-center py-10">
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
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                i === active
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
              }`}
            >
              {b.sportIcon} {b.sportName}
            </button>
          ))}
        </div>
      )}

      <h2 className="text-xl font-bold text-gray-800 dark:text-zinc-50 mb-1">
        {block.sportIcon} {block.sportName} Statistics
      </h2>
      {block.teamName && (
        <p className="text-sm text-gray-400 dark:text-zinc-500 mb-4">{block.teamName}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        {block.stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-gray-50 dark:bg-zinc-800/60 p-4 rounded-xl text-center border border-gray-100 dark:border-zinc-800"
          >
            <div className="text-2xl font-bold text-gray-800 dark:text-zinc-50">{stat.value}</div>
            <div className="text-xs text-gray-500 dark:text-zinc-400 font-medium uppercase tracking-wider mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-zinc-50 border-b border-gray-100 dark:border-zinc-800 pb-2">
          Recent Events
        </h3>
        {block.events.length === 0 ? (
          <p className="text-gray-500 dark:text-zinc-400 text-sm">No match actions logged for this sport yet.</p>
        ) : (
          <div className="space-y-3">
            {block.events.map((event) => (
              <div
                key={event.id}
                className="p-3 border border-gray-100 dark:border-zinc-800 rounded-xl flex justify-between items-center bg-gray-50/50 dark:bg-zinc-800/40 text-sm"
              >
                <div>
                  <span className="font-semibold text-blue-600 dark:text-blue-400 capitalize mr-2">{event.label}</span>
                  {event.minute != null && (
                    <span className="text-gray-400 dark:text-zinc-500 font-mono text-xs">Minute {event.minute}</span>
                  )}
                </div>
                <div className="text-gray-500 dark:text-zinc-400 text-xs">{event.matchup}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
