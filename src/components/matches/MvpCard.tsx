"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trophy, Star, Shield, Zap } from "lucide-react";

type Props = {
  matchId: string;
  sportSlug: "football" | "basketball";
};

type MvpProfile = {
  id: string;
  name: string;
  jersey_number: string;
  position: string;
  team_name: string;
  score: number;
};

export default function MvpCard({ matchId, sportSlug }: Props) {
  const supabase = createClient();
  const [mvp, setMvp] = useState<MvpProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function calculateMvp() {
      // 1. Fetch match event lines for this specific fixture match
      const { data: events, error } = await supabase
        .from("match_events")
        .select(`
          event_type,
          player_id,
          assist_player_id,
          player:players (
            id,
            name,
            jersey_number,
            position,
            team:teams(name)
          )
        `)
        .eq("match_id", matchId);

      if (error || !events || events.length === 0) {
        setLoading(false);
        return;
      }

      // 2. Aggregate counts per player
      const playerMap: Record<string, {
        playerObj: any;
        goals: number;
        assists: number;
        saves: number;
        red_cards: number;
        twos: number;
        threes: number;
        ft: number;
        rebounds: number;
        steals: number;
        blocks: number;
      }> = {};

      events.forEach((ev) => {
        const pId = ev.player_id;
        const assistId = ev.assist_player_id;

        if (pId && !playerMap[pId] && ev.player) {
          playerMap[pId] = {
            playerObj: ev.player,
            goals: 0, assists: 0, saves: 0, red_cards: 0,
            twos: 0, threes: 0, ft: 0, rebounds: 0, steals: 0, blocks: 0
          };
        }
        if (assistId && !playerMap[assistId]) {
          // Dynamic safety fallback check if assist player objective exists in line mapping
          const assistPlayerNode = events.find(e => e.player_id === assistId)?.player;
          if (assistPlayerNode) {
            playerMap[assistId] = {
              playerObj: assistPlayerNode,
              goals: 0, assists: 0, saves: 0, red_cards: 0,
              twos: 0, threes: 0, ft: 0, rebounds: 0, steals: 0, blocks: 0
            };
          }
        }

        // Increment respective event tallies
        if (pId && playerMap[pId]) {
          if (ev.event_type === "goal") playerMap[pId].goals++;
          if (ev.event_type === "save") playerMap[pId].saves++;
          if (ev.event_type === "red_card") playerMap[pId].red_cards++;
          if (ev.event_type === "2_pointer") playerMap[pId].twos++;
          if (ev.event_type === "3_pointer") playerMap[pId].threes++;
          if (ev.event_type === "free_throw") playerMap[pId].ft++;
          if (ev.event_type === "rebound" || ev.event_type === "offensive_rebound" || ev.event_type === "defensive_rebound") playerMap[pId].rebounds++;
          if (ev.event_type === "steal") playerMap[pId].steals++;
          if (ev.event_type === "block") playerMap[pId].blocks++;
        }
        if (assistId && playerMap[assistId]) {
          playerMap[assistId].assists++;
        }
      });

      // 3. Compute structural weighted algorithms
      let topMvp: MvpProfile | null = null;
      let highestScore = -Infinity;

      Object.keys(playerMap).forEach((pId) => {
        const entry = playerMap[pId];
        let score = 0;

        if (sportSlug === "football") {
          score = (entry.goals * 5) + (entry.assists * 3) + (entry.saves * 1) - (entry.red_cards * 2);
        } else {
          const totalPoints = (entry.twos * 2) + (entry.threes * 3) + entry.ft;
          score = (totalPoints) + (entry.rebounds * 1.2) + (entry.assists * 1.5) + (entry.steals * 2) + (entry.blocks * 2);
        }

        if (score > highestScore && score > 0) {
          highestScore = score;
          topMvp = {
            id: pId,
            name: entry.playerObj.name,
            jersey_number: entry.playerObj.jersey_number,
            position: entry.playerObj.position,
            team_name: entry.playerObj.team?.name || "Unknown Team",
            score: parseFloat(score.toFixed(1))
          };
        }
      });

      setMvp(topMvp);
      setLoading(false);
    }

    calculateMvp();
  }, [matchId, sportSlug, supabase]);

  if (loading) {
    return (
      <div className="w-full max-w-sm bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 animate-pulse h-36" />
    );
  }

  if (!mvp) return null;

  return (
    <div className="w-full max-w-sm bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl p-5 relative overflow-hidden shadow-xl">
      {/* Visual background accents */}
      <Trophy className="absolute right-[-10px] bottom-[-10px] h-32 w-32 text-amber-500/5 stroke-[1]" />
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
            Match MVP
          </span>
          <h4 className="text-lg font-extrabold text-zinc-900 dark:text-white mt-1.5 leading-none">
            {mvp.name}
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {mvp.team_name} · #{mvp.jersey_number} ({mvp.position})
          </p>
        </div>

        <div className="text-right">
          <div className="text-2xl font-black text-amber-500 font-mono">
            {mvp.score}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Rating Score
          </span>
        </div>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800/60 pt-3 flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400">
        <span className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 text-amber-500" /> Performance Leader
        </span>
        <span className="text-[11px] bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded-md font-mono">
          {sportSlug.toUpperCase()}
        </span>
      </div>
    </div>
  );
}