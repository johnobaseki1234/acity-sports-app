"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { SportIcon } from "@/components/ui/SportIcon";
import { leagueTagLabel } from "@/lib/utils/leagueLabel";
import { calculatePPG, calculateRPG, calculateAPG } from "@/lib/stats/basketball";
import { calculateGPG, calculateAPG as calculateFootballAPG, calculateSPG } from "@/lib/stats/football";
import { Trophy, Shield, Zap, Target, Star, SlidersHorizontal, Gauge } from "lucide-react";
import type { Season } from "@/lib/supabase/types";

type StatRow = Record<string, any>;

export default function LeagueLeadersPage() {
  const supabase = createClient();
  const [statsData, setStatsData] = useState<StatRow[]>([]);
  const [gameCounts, setGameCounts] = useState<Record<string, number>>({});
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "football" | "basketball">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      const [{ data: stats }, { data: counts }, { data: seasonRows }] = await Promise.all([
        supabase.from("player_stats").select("*"),
        supabase.from("player_game_counts").select("player_id, games_played"),
        supabase.from("seasons").select("*, sport:sports(*)").eq("is_active", true),
      ]);

      if (stats) setStatsData(stats);
      if (counts) {
        setGameCounts(Object.fromEntries(counts.map((c) => [c.player_id, c.games_played])));
      }
      if (seasonRows) setSeasons(seasonRows as Season[]);
      setLoading(false);
    }
    fetchAll();
  }, [supabase]);

  const footballLeaders = statsData.filter((s) => s.sport_slug === "football");
  const basketballLeaders = statsData.filter((s) => s.sport_slug === "basketball");

  const footballLabel = leagueLabelFor(seasons, "football", "Football");
  const basketballLabel = leagueLabelFor(seasons, "basketball", "Basketball");

  const basketballAverages = useMemo(
    () =>
      basketballLeaders
        .map((p) => {
          const games = gameCounts[p.player_id] ?? 0;
          const totalPoints = (p.two_pointers_made ?? 0) * 2 + (p.three_pointers_made ?? 0) * 3 + (p.free_throws_made ?? 0);
          return {
            ...p,
            gamesPlayed: games,
            ppg: calculatePPG(totalPoints, games),
            rpg: calculateRPG(p.rebounds ?? 0, games),
            apg: calculateAPG(p.assists ?? 0, games),
            bpg: calculateRPG(p.blocks ?? 0, games),
            spg: calculateRPG(p.steals ?? 0, games),
          };
        })
        .filter((p) => p.gamesPlayed > 0),
    [basketballLeaders, gameCounts]
  );

  const footballAverages = useMemo(
    () =>
      footballLeaders
        .map((p) => {
          const games = gameCounts[p.player_id] ?? 0;
          return {
            ...p,
            gamesPlayed: games,
            gpg: calculateGPG(p.goals ?? 0, games),
            apg: calculateFootballAPG(p.assists ?? 0, games),
            spg: calculateSPG(p.saves ?? 0, games),
          };
        })
        .filter((p) => p.gamesPlayed > 0),
    [footballLeaders, gameCounts]
  );

  const getTopLeaders = (list: StatRow[], key: string, limit = 5) =>
    [...list]
      .filter((a) => (a[key] ?? 0) > 0)
      .sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0))
      .slice(0, limit);

  const getPercentageLeaders = (list: StatRow[], madeKey: string, attKey: string, limit = 5) =>
    [...list]
      .filter((a) => (a[attKey] ?? 0) >= 5)
      .map((item) => ({ ...item, computed_pct: ((item[madeKey] ?? 0) / (item[attKey] ?? 1)) * 100 }))
      .sort((a, b) => b.computed_pct - a.computed_pct)
      .slice(0, limit);

  const getTotalPoints = (list: StatRow[], limit = 5) =>
    [...list]
      .map((item) => ({
        ...item,
        total_points: (item.two_pointers_made ?? 0) * 2 + (item.three_pointers_made ?? 0) * 3 + (item.free_throws_made ?? 0),
      }))
      .filter((a) => a.total_points > 0)
      .sort((a, b) => b.total_points - a.total_points)
      .slice(0, limit);

  if (loading) {
    return (
      <div className="min-h-screen bg-vanguard-charcoal text-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/10 border-t-vanguard-volt rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vanguard-charcoal text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto mb-8 border-b border-white/10 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <Trophy className="h-8 w-8 text-vanguard-volt shrink-0" /> LEAGUE LEADERS
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Real-time performance analytics across active divisions.</p>
        </div>
        <div className="flex bg-zinc-900/70 border border-white/10 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          {(["all", "football", "basketball"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === tab
                  ? "bg-vanguard-volt text-black"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab !== "all" && <SportIcon slug={tab} className="h-3.5 w-3.5" />}
              {tab === "all" ? "All Leagues" : tab === "football" ? footballLabel : basketballLabel}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-12">
        {/* PER-GAME AVERAGES — headline table */}
        {(activeTab === "all" || activeTab === "basketball") && basketballAverages.length > 0 && (
          <PerGameSection
            label={`${basketballLabel} · Per Game Averages`}
            sportSlug="basketball"
            rows={basketballAverages}
            columns={[
              { key: "ppg", label: "PPG" },
              { key: "rpg", label: "RPG" },
              { key: "apg", label: "APG" },
              { key: "bpg", label: "BPG" },
              { key: "spg", label: "SPG" },
            ]}
            sortKey="ppg"
          />
        )}
        {(activeTab === "all" || activeTab === "football") && footballAverages.length > 0 && (
          <PerGameSection
            label={`${footballLabel} · Per Game Averages`}
            sportSlug="football"
            rows={footballAverages}
            columns={[
              { key: "gpg", label: "GPG" },
              { key: "apg", label: "APG" },
              { key: "spg", label: "SPG" },
            ]}
            sortKey="gpg"
          />
        )}

        {/* FOOTBALL — season totals */}
        {(activeTab === "all" || activeTab === "football") && (
          <div className="animate-in fade-in duration-200">
            <div className="flex items-center gap-2 mb-6 border-l-4 border-vanguard-volt pl-3">
              <SportIcon slug="football" className="h-5 w-5 text-vanguard-volt" />
              <h2 className="text-xl font-bold tracking-wide uppercase text-white">{footballLabel} Season Totals</h2>
            </div>
            {footballLeaders.length === 0 ? (
              <p className="text-zinc-500 text-sm">No football stats yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <LeaderCard title="Top Goalscorers" icon={<Star className="h-4 w-4 text-vanguard-volt" />}
                  items={getTopLeaders(footballLeaders, "goals")} renderStat={(i) => `${i.goals} G`} />
                <LeaderCard title="Assists" icon={<Zap className="h-4 w-4 text-vanguard-volt" />}
                  items={getTopLeaders(footballLeaders, "assists")} renderStat={(i) => `${i.assists} A`} />
                <LeaderCard title="Goalkeeper Saves" icon={<Shield className="h-4 w-4 text-vanguard-volt" />}
                  items={getTopLeaders(footballLeaders, "saves")} renderStat={(i) => `${i.saves} SV`} />
              </div>
            )}
          </div>
        )}

        {/* BASKETBALL — season totals */}
        {(activeTab === "all" || activeTab === "basketball") && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 mb-2 border-l-4 border-vanguard-volt pl-3">
              <SportIcon slug="basketball" className="h-5 w-5 text-vanguard-volt" />
              <h2 className="text-xl font-bold tracking-wide uppercase text-white">{basketballLabel} Season Totals</h2>
            </div>
            {basketballLeaders.length === 0 ? (
              <p className="text-zinc-500 text-sm">No basketball stats yet.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <LeaderCard title="Points" icon={<Star className="h-4 w-4 text-vanguard-volt" />}
                    items={getTotalPoints(basketballLeaders)} renderStat={(i) => `${i.total_points} PTS`} compact />
                  <LeaderCard title="Rebounds" icon={<Shield className="h-4 w-4 text-vanguard-volt" />}
                    items={getTopLeaders(basketballLeaders, "rebounds")} renderStat={(i) => `${i.rebounds} REB`} compact />
                  <LeaderCard title="Assists" icon={<Zap className="h-4 w-4 text-vanguard-volt" />}
                    items={getTopLeaders(basketballLeaders, "assists")} renderStat={(i) => `${i.assists} AST`} compact />
                  <LeaderCard title="Steals" icon={<Target className="h-4 w-4 text-vanguard-volt" />}
                    items={getTopLeaders(basketballLeaders, "steals")} renderStat={(i) => `${i.steals} STL`} compact />
                  <LeaderCard title="Blocks" icon={<Shield className="h-4 w-4 text-vanguard-volt" />}
                    items={getTopLeaders(basketballLeaders, "blocks")} renderStat={(i) => `${i.blocks} BLK`} compact />
                </div>

                <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <SlidersHorizontal className="h-4 w-4 text-zinc-400" />
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Shooting Efficiency</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <LeaderCard title="2PT Field Goal %" icon={<Target className="h-4 w-4 text-vanguard-volt" />}
                      items={getPercentageLeaders(basketballLeaders, "two_pointers_made", "two_pointers_attempted")}
                      renderStat={(i) => `${i.computed_pct.toFixed(1)}%`} footnote="*Min 5 attempts" />
                    <LeaderCard title="3-Point %" icon={<Target className="h-4 w-4 text-vanguard-volt" />}
                      items={getPercentageLeaders(basketballLeaders, "three_pointers_made", "three_pointers_attempted")}
                      renderStat={(i) => `${i.computed_pct.toFixed(1)}%`} footnote="*Min 5 attempts" />
                    <LeaderCard title="Free Throw %" icon={<Target className="h-4 w-4 text-vanguard-volt" />}
                      items={getPercentageLeaders(basketballLeaders, "free_throws_made", "free_throws_attempted")}
                      renderStat={(i) => `${i.computed_pct.toFixed(1)}%`} footnote="*Min 5 attempts" />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function leagueLabelFor(seasons: Season[], sportSlug: string, fallback: string): string {
  const season = seasons.find((s) => s.sport?.slug === sportSlug);
  return season ? leagueTagLabel(season) : fallback;
}

function PerGameSection({
  label,
  sportSlug,
  rows,
  columns,
  sortKey,
}: {
  label: string;
  sportSlug: string;
  rows: StatRow[];
  columns: { key: string; label: string }[];
  sortKey: string;
}) {
  const sorted = [...rows].sort((a, b) => b[sortKey] - a[sortKey]).slice(0, 10);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Gauge className="h-5 w-5 text-vanguard-volt" />
        <h2 className="text-lg font-black tracking-tight text-white uppercase">{label}</h2>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-vanguard-volt/20 bg-zinc-900/70">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-white/[0.03] border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="pl-4 pr-2 py-2.5 text-left font-black w-8">#</th>
              <th className="px-2 py-2.5 text-left font-black">Player</th>
              <th className="px-2 py-2.5 text-center font-black hidden sm:table-cell">GP</th>
              {columns.map((c) => (
                <th key={c.key} className="px-2 py-2.5 text-center font-black">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="text-zinc-300">
            {sorted.map((row, i) => (
              <tr key={row.player_id ?? i} className={`h-10 border-b border-white/5 last:border-0 ${i === 0 ? "bg-vanguard-volt/[0.06]" : ""}`}>
                <td className="pl-4 pr-2 py-1.5">
                  <span className={`grid place-items-center w-5 h-5 rounded text-[10px] font-black tabular-nums ${i === 0 ? "bg-vanguard-volt text-black" : "text-zinc-500"}`}>
                    {i + 1}
                  </span>
                </td>
                <td className="px-2 py-1.5">
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate text-[13px]">{row.player_name ?? "Player"}</p>
                    <p className="text-[10px] text-zinc-500">{row.team_short_name ?? "FA"} · #{row.jersey_number ?? "00"}</p>
                  </div>
                </td>
                <td className="px-2 py-1.5 text-center tabular-nums text-xs hidden sm:table-cell">{row.gamesPlayed}</td>
                {columns.map((c) => (
                  <td key={c.key} className="px-2 py-1.5 text-center tabular-nums font-black text-vanguard-volt">
                    {row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LeaderCard({ title, icon, items, renderStat, compact = false, footnote }: {
  title: string; icon: React.ReactNode; items: StatRow[];
  renderStat: (item: StatRow) => string; compact?: boolean; footnote?: string;
}) {
  return (
    <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
        {icon}
        <h3 className="font-bold text-xs tracking-wider uppercase text-zinc-200">{title}</h3>
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-6 text-xs text-zinc-500 italic">No entries yet</div>
      ) : (
        <div className="space-y-2 flex-1">
          {items.map((item, idx) => {
            const isFirst = idx === 0;
            return (
              <div key={item.player_id || idx} className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`text-xs font-black w-4 text-center ${isFirst ? "text-vanguard-volt" : "text-zinc-500"}`}>{idx + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate leading-none">{item.player_name || "Player"}</p>
                    {!compact && (
                      <p className="text-[11px] text-zinc-400 truncate mt-1">
                        {item.team_short_name || "FA"} · #{item.jersey_number ?? "00"}
                      </p>
                    )}
                  </div>
                </div>
                <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-lg border shrink-0 ${
                  isFirst ? "bg-vanguard-volt/10 text-vanguard-volt border-vanguard-volt/20" : "bg-black/30 text-zinc-300 border-white/10"
                }`}>
                  {renderStat(item)}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {footnote && <span className="text-[10px] text-zinc-500 mt-2 block text-right italic">{footnote}</span>}
    </div>
  );
}
