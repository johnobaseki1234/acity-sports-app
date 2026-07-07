"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type MatchResult = "W" | "D" | "L";

type Props = {
  teamId: string;
};

export default function TeamForm({ teamId }: Props) {
  const supabase = createClient();
  const [formResults, setFormResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeamForm() {
      // Pull last 5 finished matches where the team played
      const { data, error } = await supabase
        .from("matches")
        .select("id, home_team_id, away_team_id, home_score, away_score, status, finished_at")
        .eq("status", "finished")
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .order("finished_at", { ascending: false })
        .limit(5);

      if (error || !data) {
        setLoading(false);
        return;
      }

      // Map raw scores into clear W / D / L results relative to this team
      const parsedForm: MatchResult[] = data.map((match) => {
        const isHome = match.home_team_id === teamId;
        const teamScore = isHome ? (match.home_score ?? 0) : (match.away_score ?? 0);
        const opponentScore = isHome ? (match.away_score ?? 0) : (match.home_score ?? 0);

        if (teamScore > opponentScore) return "W";
        if (teamScore === opponentScore) return "D";
        return "L";
      });

      // Reverse so it reads chronologically from left (oldest) to right (most recent)
      setFormResults(parsedForm.reverse());
      setLoading(false);
    }

    fetchTeamForm();
  }, [teamId, supabase]);

  if (loading) {
    return (
      <div className="flex gap-1 items-center animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-6 w-6 rounded-md bg-zinc-200 dark:bg-zinc-800" />
        ))}
      </div>
    );
  }

  if (formResults.length === 0) {
    return <span className="text-xs text-zinc-400 font-medium italic">No matches played</span>;
  }

  // Visual style configurations
  const colorMap: Record<MatchResult, string> = {
    W: "bg-emerald-500 text-white shadow-md shadow-emerald-500/20 font-black",
    D: "bg-amber-500 text-zinc-950 font-bold",
    L: "bg-vanguard-crimson text-white shadow-md shadow-vanguard-crimson/20 font-black",
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        Recent Form
      </span>
      <div className="flex items-center gap-1.5">
        {formResults.map((result, idx) => (
          <div
            key={idx}
            className={`h-6 w-6 rounded-md text-[11px] flex items-center justify-center tracking-normal select-none ${colorMap[result]}`}
            title={result === "W" ? "Win" : result === "D" ? "Draw" : "Loss"}
          >
            {result}
          </div>
        ))}
      </div>
    </div>
  );
}