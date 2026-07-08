"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "vanguard_league_ids";
const ONBOARDING_KEY = "vanguard_onboarding_done";

/**
 * A user's "Leagues of Interest" (selected season ids from the optional
 * /onboarding preferences screen). localStorage is the source of truth so
 * filtering works instantly for every visitor, signed in or not — mirroring
 * the existing useFollowedTeams pattern. If a Supabase session exists,
 * selections are also best-effort synced to `user_preferences` for
 * cross-device persistence. Visiting /onboarding is entirely optional —
 * no preferences saved here means every active league shows by default.
 */
export function useLeagueOfInterest() {
  const [leagueIds, setLeagueIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.every((id) => typeof id === "string")) {
          setLeagueIds(parsed);
        }
      }
    } catch {
      // Corrupt local state — fall back to defaults rather than throwing.
    }
  }, []);

  const saveSelection = useCallback((ids: string[]) => {
    setLeagueIds(ids);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    localStorage.setItem(ONBOARDING_KEY, "1");

    // Best-effort cross-device sync — never blocks the local experience.
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      await supabase.from("user_preferences").upsert({
        user_id: data.user.id,
        favorite_season_ids: ids,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      });
    })();
  }, []);

  const toggleLeague = useCallback(
    (seasonId: string) => {
      const updated = leagueIds.includes(seasonId)
        ? leagueIds.filter((id) => id !== seasonId)
        : [...leagueIds, seasonId];
      saveSelection(updated);
    },
    [leagueIds, saveSelection]
  );

  return { leagueIds, saveSelection, toggleLeague };
}
