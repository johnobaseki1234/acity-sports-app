"use client";

import type { Player } from "@/lib/supabase/types";

type Props = {
  players: Player[];
  teamName: string;
  eventLabel: string;
  onSelect: (player: Player) => void;
  onCancel: () => void;
};

export function PlayerPicker({ players, teamName, eventLabel, onSelect, onCancel }: Props) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end">
      <div className="bg-gray-800 w-full rounded-t-2xl max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <div>
            <p className="font-bold text-white">{eventLabel}</p>
            <p className="text-xs text-gray-400">{teamName} — select player</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
        </div>

        {/* Player list */}
        <div className="overflow-y-auto flex-1">
          {players.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No players added for this team</p>
          ) : (
            players.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 active:bg-gray-600 transition-colors border-b border-gray-700/50"
              >
                <div className="w-9 h-9 bg-gray-600 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {p.jersey_number}
                </div>
                <div className="text-left">
                  <div className="font-medium text-white">{p.name}</div>
                  <div className="text-xs text-gray-400">{p.position}</div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* No player option for events that are team-level */}
        <div className="border-t border-gray-700 p-3">
          <button
            onClick={() => onSelect({ id: "", name: "Unknown", jersey_number: 0, position: "", secondary_position: null, team_id: "", photo_url: null, is_active: true, created_at: "" })}
            className="w-full text-center text-gray-400 hover:text-white text-sm py-2"
          >
            Skip — no specific player
          </button>
        </div>
      </div>
    </div>
  );
}
