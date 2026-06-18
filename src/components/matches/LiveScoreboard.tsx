"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { MatchCard } from "./MatchCard";
import type { Match } from "@/lib/supabase/types";

type Props = { initialLive: Match[]; sportSlug?: string };

export function LiveScoreboard({ initialLive, sportSlug }: Props) {
  const supabase = createClient();
  const [liveMatches, setLiveMatches] = useState(initialLive);

  useEffect(() => {
    if (liveMatches.length === 0) return;

    const ids = liveMatches.map((m) => m.id);
    const channel = supabase
      .channel("live-scores")
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "matches",
      }, (payload) => {
        if (ids.includes(payload.new.id)) {
          setLiveMatches((prev) =>
            prev.map((m) => m.id === payload.new.id ? { ...m, ...payload.new } : m)
          );
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [liveMatches.length]);

  if (liveMatches.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2.5 mb-3.5 px-0.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold px-2.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE NOW
        </span>
        <span className="rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300 text-xs font-bold px-2 py-0.5">
          {liveMatches.length}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {liveMatches.map((m) => <MatchCard key={m.id} match={m} />)}
      </div>
    </section>
  );
}
