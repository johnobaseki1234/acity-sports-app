"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, Save, ShieldAlert, CheckCircle } from "lucide-react";

type Player = {
  id: string;
  name: string;
  jersey_number: string;
  position: string;
};

type PositionSlot = {
  id: string;
  label: string;
  x: number; // Percentage coordinate on the tactical pitch canvas
  y: number; 
};

type Props = {
  teamId: string;
  matchId: string;
  sportSlug: "football" | "basketball";
};

// Hardcoded tactical layouts mapping out spatial coordinates on our CSS field
const FORMATIONS: Record<"football" | "basketball", PositionSlot[]> = {
  football: [
    { id: "gk", label: "GK", x: 50, y: 88 },
    { id: "lb", label: "LB", x: 15, y: 68 },
    { id: "lcb", label: "LCB", x: 38, y: 70 },
    { id: "rcb", label: "RCB", x: 62, y: 70 },
    { id: "rb", label: "RB", x: 85, y: 68 },
    { id: "lcm", label: "LCM", x: 25, y: 45 },
    { id: "cm", label: "CM", x: 50, y: 48 },
    { id: "rcm", label: "RCM", x: 75, y: 45 },
    { id: "lw", label: "LW", x: 20, y: 20 },
    { id: "st", label: "ST", x: 50, y: 15 },
    { id: "rw", label: "RW", x: 80, y: 20 },
  ],
  basketball: [
    { id: "pg", label: "PG", x: 50, y: 78 },
    { id: "sg", label: "SG", x: 20, y: 60 },
    { id: "sf", label: "SF", x: 80, y: 60 },
    { id: "pf", label: "PF", x: 35, y: 35 },
    { id: "c", label: "C", x: 65, y: 25 },
  ],
};

export default function LineupBuilder({ teamId, matchId, sportSlug }: Props) {
  const supabase = createClient();
  const slots = FORMATIONS[sportSlug];

  const [roster, setRoster] = useState<Player[]>([]);
  const [lineup, setLineup] = useState<Record<string, string>>({}); // Maps slot.id -> player.id
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    async function loadLineupData() {
      // 1. Fetch team roster pool
      const { data: players } = await supabase
        .from("players")
        .select("id, name, jersey_number, position")
        .eq("team_id", teamId);
      
      if (players) setRoster(players);

      // 2. Fetch existing saved lineup for this match context
      const { data: savedLineup } = await supabase
        .from("match_lineups")
        .select("player_id, slot_id")
        .eq("match_id", matchId)
        .eq("team_id", teamId);

      if (savedLineup) {
        const initialMap: Record<string, string> = {};
        savedLineup.forEach((row) => {
          initialMap[row.slot_id] = row.player_id;
        });
        setLineup(initialMap);
      }
    }
    loadLineupData();
  }, [teamId, matchId, supabase]);

  const handleAssignPlayer = (playerId: string) => {
    if (!selectedSlot) return;

    setLineup((prev) => {
      const next = { ...prev };
      // Prevent duplicates: Remove player if already assigned elsewhere
      Object.keys(next).forEach((key) => {
        if (next[key] === playerId) delete next[key];
      });
      next[selectedSlot] = playerId;
      return next;
    });
    setSelectedSlot(null);
  };

  const handleSaveLineup = async () => {
    setSaving(true);
    setToast(null);

    // Format state records array for batch transaction insertion
    const insertPayload = Object.entries(lineup).map(([slotId, playerId]) => ({
      match_id: matchId,
      team_id: teamId,
      player_id: playerId,
      slot_id: slotId,
    }));

    // Clear old state tracking references to avoid unique key index constraints
    const { error: clearError } = await supabase
      .from("match_lineups")
      .delete()
      .eq("match_id", matchId)
      .eq("team_id", teamId);

    if (clearError) {
      setToast({ type: "error", msg: "Failed to clear historic lineup cache data record items." });
      setSaving(false);
      return;
    }

    const { error: saveError } = await supabase
      .from("match_lineups")
      .insert(insertPayload);

    setSaving(false);
    if (saveError) {
      setToast({ type: "error", msg: "Could not write transaction updates to database." });
    } else {
      setToast({ type: "success", msg: "Tactical lineup synced and saved successfully." });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-white dark:bg-[#111827] border border-zinc-200 dark:border-gray-800 rounded-2xl p-6 shadow-2xl">
      
      {/* LEFT AREA: PITCH CANVAS DISPLAY */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
            <Users className="h-4 w-4 text-red-500" /> Tactical Pitch Layout
          </h3>
          <button
            onClick={handleSaveLineup}
            disabled={saving}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 text-white font-bold text-xs uppercase px-4 py-2 rounded-xl transition-colors shadow-md shadow-red-600/20"
          >
            <Save className="h-3.5 w-3.5" /> {saving ? "Syncing..." : "Save Lineup"}
          </button>
        </div>

        {toast && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            {toast.type === "success" ? <CheckCircle className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
            {toast.msg}
          </div>
        )}

        {/* CSS Field Canvas Box Rendering */}
        <div className="relative w-full aspect-[4/5] bg-gradient-to-b from-emerald-800 to-emerald-950 dark:from-[#0f2419] dark:to-[#07110c] border border-emerald-700/30 rounded-2xl overflow-hidden shadow-inner">
          {/* Subtle field marking lines decoration layouts */}
          <div className="absolute inset-x-0 top-0 bottom-1/2 border-b border-white/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border border-white/10" />
          
          {slots.map((slot) => {
            const assignedPlayerId = lineup[slot.id];
            const assignedPlayer = roster.find((p) => p.id === assignedPlayerId);
            const isSelected = selectedSlot === slot.id;

            return (
              <button
                key={slot.id}
                onClick={() => setSelectedSlot(slot.id)}
                style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group focus:outline-none"
              >
                <div className={`h-9 w-9 rounded-full flex items-center justify-center font-black text-xs border transition-all ${
                  assignedPlayer 
                    ? "bg-zinc-950 text-white border-amber-500 scale-105 shadow-[0_0_12px_rgba(245,158,11,0.3)]" 
                    : isSelected 
                    ? "bg-red-600 text-white border-white animate-bounce" 
                    : "bg-white/10 text-white/60 border-white/20 hover:bg-white/20 hover:text-white"
                }`}>
                  {assignedPlayer ? `#${assignedPlayer.jersey_number}` : slot.label}
                </div>
                <span className="mt-1 text-[10px] font-bold text-white bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded border border-white/5 whitespace-nowrap max-w-[80px] truncate">
                  {assignedPlayer ? assignedPlayer.name : "Unassigned"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT AREA: ROSTER SELECTOR DRAWER PANEL */}
      <div className="bg-zinc-50 dark:bg-[#0B0F19] border border-zinc-200 dark:border-gray-800 rounded-2xl p-4 flex flex-col h-full min-h-[350px]">
        <div className="border-b border-zinc-200 dark:border-gray-800 pb-3 mb-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
            {selectedSlot ? `Assigning ${selectedSlot.toUpperCase()}` : "Select Node on Pitch"}
          </h4>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {selectedSlot ? "Click a candidate below to slot them into position." : "Click an open position circle to assign a player."}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-[450px]">
          {roster.map((player) => {
            const currentAssignedSlot = Object.keys(lineup).find((k) => lineup[k] === player.id);

            return (
              <button
                key={player.id}
                disabled={!selectedSlot}
                onClick={() => handleAssignPlayer(player.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left border transition-all text-xs ${
                  !selectedSlot 
                    ? "opacity-50 border-transparent cursor-not-allowed" 
                    : "border-zinc-200 dark:border-gray-800/80 hover:border-red-500 dark:hover:border-red-500 bg-white dark:bg-[#111827]"
                }`}
              >
                <div className="min-w-0">
                  <p className="font-bold text-zinc-800 dark:text-zinc-200 truncate">{player.name}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{player.position} · #{player.jersey_number}</p>
                </div>
                {currentAssignedSlot && (
                  <span className="text-[9px] font-black uppercase bg-amber-500/10 border border-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded-md">
                    {currentAssignedSlot}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}