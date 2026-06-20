"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AssistPicker } from "./AssistPicker";

type Player = {
  id: string;
  name: string;
  jersey_number: string | number;
};

type Match = {
  id: string;
  current_period: number;
  home_team_id: string;
  away_team_id: string;
};

type EventTypeConfig = {
  type: string;
  label: string;
};

type Props = {
  match: Match;
  homePlayers: Player[];
  awayPlayers: Player[];
};

type PlayerPickerProps = {
  players: Player[];
  title: string;
  onSelect: (player: Player) => void;
  onCancel: () => void;
};

function PlayerPicker({ players, title, onSelect, onCancel }: PlayerPickerProps) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-3xl w-full max-w-md p-6 border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {players.map((player) => (
            <button
              key={player.id}
              onClick={() => onSelect(player)}
              className="w-full p-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-left font-medium"
            >
              #{player.jersey_number} - {player.name}
            </button>
          ))}
        </div>
        <button onClick={onCancel} className="w-full mt-4 bg-gray-700 text-white rounded-xl py-2.5 font-semibold">
          Cancel
        </button>
      </div>
    </div>
  );
}

export function ScorerConsole({ match, homePlayers, awayPlayers }: Props) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [minuteInput, setMinuteInput] = useState("");

  const [pending, setPending] = useState<{
    eventType: EventTypeConfig;
    teamId: string;
    side: "home" | "away";
  } | null>(null);

  const [pendingAssist, setPendingAssist] = useState<{
    scorer: Player;
    teamId: string;
    side: "home" | "away";
    eventType: EventTypeConfig;
  } | null>(null);

  async function logEvent(
    eventType: EventTypeConfig,
    teamId: string,
    player: Player | null,
    assistPlayer?: Player | null
  ) {
    setSaving(true);
    const { error } = await supabase.from("match_events").insert({
      match_id: match.id,
      event_type: eventType.type,
      team_id: teamId,
      player_id: player?.id ?? null,
      assist_player_id: assistPlayer?.id ?? null,
      period: match.current_period ?? 1,
      match_minute: minuteInput ? parseInt(minuteInput, 10) : null,
    });

    setMinuteInput("");
    setSaving(false);

    if (error) {
      alert(`Error saving event: ${error.message}`);
    }
  }

  const actionButtons = [
    { type: "goal", label: "Goal ⚽" },
    { type: "yellow_card", label: "Yellow Card 🟨" },
    { type: "red_card", label: "Red Card 🟥" },
  ];

  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <h2 className="text-xl font-bold text-white">Live Action Console</h2>
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-gray-400 uppercase">Match Min:</label>
          <input
            type="number"
            value={minuteInput}
            onChange={(e) => setMinuteInput(e.target.value)}
            placeholder="e.g., 72"
            className="w-20 bg-gray-800 border border-gray-700 rounded-xl px-2.5 py-1 text-white text-center font-bold focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-800/40 border border-gray-800/80 p-4 rounded-2xl space-y-3">
          <h3 className="text-sm font-bold text-blue-400 uppercase">Home Actions</h3>
          <div className="flex flex-col space-y-2">
            {actionButtons.map((btn) => (
              <button
                key={btn.type}
                disabled={saving}
                onClick={() => setPending({ eventType: btn, teamId: match.home_team_id, side: "home" })}
                className="w-full bg-blue-600/10 hover:bg-blue-600 text-blue-400 font-semibold py-3 px-4 rounded-xl text-left border border-blue-500/20"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-800/40 border border-gray-800/80 p-4 rounded-2xl space-y-3">
          <h3 className="text-sm font-bold text-orange-400 uppercase">Away Actions</h3>
          <div className="flex flex-col space-y-2">
            {actionButtons.map((btn) => (
              <button
                key={btn.type}
                disabled={saving}
                onClick={() => setPending({ eventType: btn, teamId: match.away_team_id, side: "away" })}
                className="w-full bg-orange-600/10 hover:bg-orange-600 text-orange-400 font-semibold py-3 px-4 rounded-xl text-left border border-orange-500/20"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {pending && (
        <PlayerPicker
          title={`Select Player`}
          players={pending.side === "home" ? homePlayers : awayPlayers}
          onSelect={(player) => {
            if (pending.eventType.type === "goal") {
              setPendingAssist({
                scorer: player,
                teamId: pending.teamId,
                side: pending.side,
                eventType: pending.eventType,
              });
              setPending(null);
              return;
            }
            logEvent(pending.eventType, pending.teamId, player);
            setPending(null);
          }}
          onCancel={() => setPending(null)}
        />
      )}

      {pendingAssist && (
        <AssistPicker
          players={pendingAssist.side === "home" ? homePlayers : awayPlayers}
          scorerId={pendingAssist.scorer.id}
          onSelect={(assistPlayer) => {
            logEvent(pendingAssist.eventType, pendingAssist.teamId, pendingAssist.scorer, assistPlayer);
            setPendingAssist(null);
          }}
          onCancel={() => setPendingAssist(null)}
        />
      )}
    </div>
  );
}