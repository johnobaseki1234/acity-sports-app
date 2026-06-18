"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";

export interface Match {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
  status: "scheduled" | "live" | "finished";
  current_period: number;
  sport: "football" | "basketball" | "volleyball";
  venue?: string;
}

export interface MatchEvent {
  id: string;
  match_id: string;
  team_id: string;
  player_id?: string;
  event_type: string;
  value?: number;
  period: number;
  minute?: number;
  created_at: string;
}

export function useRealtimeMatch(
  matchId: string,
  initialMatch: Match,
  initialEvents: MatchEvent[]
) {
  const supabase = createClient();
  const [match, setMatch] = useState<Match>(initialMatch);
  const [events, setEvents] = useState<MatchEvent[]>(initialEvents);

  useEffect(() => {
    // Open a targeted realtime ingestion pipeline for the active match ID channel
    const channel = supabase.channel(`match:${matchId}`);

    // Listen for incremental overall score or state changes
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "matches",
        filter: `id=eq.${matchId}`,
      },
      (payload) => {
        setMatch(payload.new as Match);
      }
    );

    // Listen for incremental match timeline adjustments (goals, points, fouls)
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "match_events",
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        setEvents((prev) => [payload.new as MatchEvent, ...prev]);
      }
    );

    channel.subscribe();

    // Safely tear down subscription channels when component bounds clean up
    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, supabase]);

  return {
    match,
    events,
  };
}