"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Target } from "lucide-react";
import type { MatchEvent, Player, Sport, Team } from "@/lib/supabase/types";
import { computeSingleGameStats, EMPTY_GAME_STATS } from "@/lib/utils/singleGameStats";
import { ShotDistribution } from "@/components/matches/ShotDistribution";
import { fetchCareerAverages, type CareerAverages } from "@/lib/stats/careerAverages";

type Props = {
  player: Player | null;
  team?: Team;
  events: MatchEvent[];
  sport: Sport;
  onClose: () => void;
};

export function PlayerDrawer({ player, team, events, sport, onClose }: Props) {
  const stats = useMemo(
    () =>
      player
        ? computeSingleGameStats(player.id, events, sport)
        : EMPTY_GAME_STATS,
    [player, events, sport]
  );

  const scoreLabel = sport.slug === "football" ? "Goals" : "Points";
  const defenseLabel = sport.slug === "football" ? "Saves" : "Blocks";
  const defenseValue = sport.slug === "football" ? stats.saves : stats.blocks;

  const [career, setCareer] = useState<CareerAverages | null>(null);
  useEffect(() => {
    if (!player) {
      setCareer(null);
      return;
    }
    let cancelled = false;
    fetchCareerAverages(player.id, sport.slug).then((result) => {
      if (!cancelled) setCareer(result);
    });
    return () => {
      cancelled = true;
    };
  }, [player, sport.slug]);

  return (
    <AnimatePresence>
      {player && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Bottom sheet */}
          <motion.div
            key="sheet"
            role="dialog"
            aria-label={`${player.name} match stats`}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-3xl border border-b-0 border-white/10 bg-vanguard-charcoal text-white shadow-2xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 600) onClose();
            }}
          >
            {/* Grab handle */}
            <div className="pt-3 pb-1 grid place-items-center">
              <span className="h-1.5 w-10 rounded-full bg-white/20" />
            </div>

            <div className="px-5 pb-8 pb-safe max-h-[82vh] overflow-y-auto">
              {/* Player identity */}
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="grid place-items-center h-12 w-12 shrink-0 rounded-2xl font-black text-lg tabular-nums text-black bg-vanguard-volt"
                  >
                    {player.jersey_number}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-lg leading-tight truncate">{player.name}</div>
                    <div className="text-xs text-zinc-400">
                      {team?.name ?? ""}
                      {player.position ? ` · ${player.position}` : ""}
                    </div>
                  </div>
                </div>
                <button
                  aria-label="Close"
                  onClick={onClose}
                  className="grid place-items-center h-9 w-9 shrink-0 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 transition active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Single-game telemetry */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                <StatTile label={scoreLabel} value={stats.score} accent="volt" />
                <StatTile label="Assists" value={stats.assists} accent="volt" />
                <StatTile label={defenseLabel} value={defenseValue} accent="volt" />
                <StatTile label="Fouls" value={stats.fouls} accent="crimson" />
              </div>

              {/* Season per-game averages */}
              {career && (
                <div className="rounded-2xl bg-white/[0.03] border border-white/10 px-3 py-2.5 mb-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">
                    Season Averages · {career.gamesPlayed} GP
                  </p>
                  <div className="flex items-center justify-between">
                    {career.lines.map((l) => (
                      <div key={l.label} className="text-center">
                        <div className="text-sm font-black tabular-nums text-white">{l.value}</div>
                        <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                          {l.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 14-Zone Shot Distribution */}
              {sport.slug === "basketball" ? (
                <ShotDistribution playerId={player.id} events={events} />
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-center">
                  <Target className="h-6 w-6 mx-auto mb-2 text-vanguard-volt" />
                  <p className="text-sm font-semibold text-zinc-300">Zone Telemetry</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Positional heat mapping coming soon for {sport.name.toLowerCase()}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "volt" | "crimson";
}) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-3 text-center">
      <div
        className={`text-2xl font-black tabular-nums ${
          accent === "crimson" && value > 0 ? "text-vanguard-crimson" : "text-vanguard-volt"
        }`}
      >
        {value}
      </div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mt-1">
        {label}
      </div>
    </div>
  );
}
