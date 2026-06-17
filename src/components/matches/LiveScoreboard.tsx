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
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-bold text-sm uppercase tracking-wide text-gray-500">🔴 Live Now</h2>
        <span className="bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
          {liveMatches.length}
        </span>
      </div>
      <div className="space-y-3">
        {liveMatches.map((m) => <MatchCard key={m.id} match={m} />)}
      </div>
    </section>
  );
}
