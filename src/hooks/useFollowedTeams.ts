"use client";

import { useEffect, useState } from "react";

export function useFollowedTeams() {
  const [followedTeams, setFollowedTeams] = useState<string[]>([]);

  // Load followed teams from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("followedTeams");
      if (!stored) return;

      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.every((id) => typeof id === "string")) {
        setFollowedTeams(parsed);
      } else {
        localStorage.removeItem("followedTeams");
      }
    } catch (e) {
      console.error("Failed to parse followed teams:", e);
      localStorage.removeItem("followedTeams");
    }
  }, []);

  // Toggle following status
  const toggleTeam = (teamId: string) => {
    setFollowedTeams((current) => {
      const updated = current.includes(teamId)
        ? current.filter((id) => id !== teamId)
        : [...current, teamId];

      localStorage.setItem("followedTeams", JSON.stringify(updated));
      return updated;
    });
  };

  const isFollowing = (teamId: string) => followedTeams.includes(teamId);

  return {
    followedTeams,
    toggleTeam,
    isFollowing,
  };
}
