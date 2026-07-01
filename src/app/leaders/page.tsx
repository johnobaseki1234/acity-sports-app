"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { SportIcon } from "@/components/ui/SportIcon";
import { Trophy, Shield, Zap, Target, Star, SlidersHorizontal } from "lucide-react";

export default function LeagueLeadersPage() {
  const supabase = createClient();
  const [statsData, setStatsData] = useState<any[]>([]);
  const [teamSportMap, setTeamSportMap] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"all" | "football" | "basketball">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const { data, error } = await supabase
        .from("player_stats")
        .select(`
          *,
          player:players(
            id,
            name,
            jersey_number,
            position,
            team:teams(
              id,
              name,
              short_name,
              logo_url
            )
          )
        `);
      

      const { data: seasonTeams } = await supabase
        .from("season_teams")
        .select("team_id, season:seasons(sport:sports(slug))");

      const nextTeamSportMap: Record<string, string> = {};
      (seasonTeams ?? []).forEach((st: any) => {
        const slug = st.season?.sport?.slug;
        if (slug) nextTeamSportMap[st.team_id] = slug;
      });

      setTeamSportMap(nextTeamSportMap);

      if (!error && data) {
        setStatsData(data);
      }
      setLoading(false);
    }
    fetchStats();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-700 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Filter lists dynamically based on selected active category tag
  const footballLeaders = statsData.filter((s: any) => teamSportMap[s.player?.team?.id] === "football")
  const basketballLeaders = statsData.filter((s: any) => teamSportMap[s.player?.team?.id] === "basketball");

  const getTopLeaders = (list: any[], key: string, limit = 5) => {
    return [...list]
      .filter((a) => (a[key] ?? 0) > 0)
      .sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0))
      .slice(0, limit);
  };

  const getBasketballPercentageLeaders = (list: any[], madeKey: string, attKey: string, limit = 5) => {
    return [...list]
      .filter((a) => (a[attKey] ?? 0) >= 5)
      .map((item) => ({ ...item, computed_pct: ((item[madeKey] ?? 0) / (item[attKey] ?? 1)) * 100 }))
      .sort((a, b) => b.computed_pct - a.computed_pct)
      .slice(0, limit);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto mb-8 border-b border-gray-800 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <Trophy className="h-8 w-8 text-amber-500 shrink-0" /> LEAGUE LEADERS
          </h1>
          <p className="text-sm text-gray-400 mt-1">Real-time performance analytics aggregate boards across active divisions.</p>
        </div>

        {/* Dynamic Sport Interactive Category Tabs */}
        <div className="flex bg-[#111827] border border-gray-800 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${activeTab === "all" ? "bg-gray-800 text-white" : "text-gray-400 hover:text-gray-200"}`}
          >
            All Sports
          </button>
          <button
            onClick={() => setActiveTab("football")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-colors ${activeTab === "football" ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-gray-200"}`}
          >
            <SportIcon slug="football" className="h-3.5 w-3.5" /> Football
          </button>
          <button
            onClick={() => setActiveTab("basketball")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-colors ${activeTab === "basketball" ? "bg-amber-600 text-white" : "text-gray-400 hover:text-gray-200"}`}
          >
            <SportIcon slug="basketball" className="h-3.5 w-3.5" /> Basketball
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-12">
        {/* FOOTBALL WRAPPER PANEL */}
        {(activeTab === "all" || activeTab === "football") && footballLeaders.length > 0 && (
          <div className="animate-in fade-in duration-200">
            <div className="flex items-center gap-2 mb-6 border-l-4 border-emerald-500 pl-3">
              <SportIcon slug="football" className="h-5 w-5 text-emerald-400" />
              <h2 className="text-xl font-bold tracking-wide uppercase text-white">Football Leaders</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <LeaderCard
                title="Top Goalscorers"
                icon={<Star className="h-4 w-4 text-emerald-400" />}
                items={getTopLeaders(footballLeaders, "goals")}
                renderStat={(item) => `${item.goals} G`}
              />
              <LeaderCard
                title="Playmaking Assists"
                icon={<Zap className="h-4 w-4 text-sky-400" />}
                items={getTopLeaders(footballLeaders, "assists")}
                renderStat={(item) => `${item.assists} A`}
              />
              <LeaderCard
                title="Goalkeeper Saves"
                icon={<Shield className="h-4 w-4 text-purple-400" />}
                items={getTopLeaders(footballLeaders, "saves")}
                renderStat={(item) => `${item.saves} SV`}
              />
            </div>
          </div>
        )}

        {/* BASKETBALL WRAPPER PANEL */}
        {(activeTab === "all" || activeTab === "basketball") && basketballLeaders.length > 0 && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 mb-2 border-l-4 border-amber-500 pl-3">
              <SportIcon slug="basketball" className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-bold tracking-wide uppercase text-white">Basketball Leaders</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <LeaderCard
                title="Points"
                icon={<Star className="h-4 w-4 text-amber-400" />}
                items={getTopLeaders(basketballLeaders, "two_pointers_made")}
                renderStat={(item) => `${(item.two_pointers_made * 2) + (item.three_pointers_made * 3) + (item.free_throws_made)} PTS`}
                compact
              />
              <LeaderCard
                title="Rebounds"
                icon={<Shield className="h-4 w-4 text-teal-400" />}
                items={getTopLeaders(basketballLeaders, "rebounds")}
                renderStat={(item) => `${item.rebounds} REB`}
                compact
              />
              <LeaderCard
                title="Assists"
                icon={<Zap className="h-4 w-4 text-cyan-400" />}
                items={getTopLeaders(basketballLeaders, "assists")}
                renderStat={(item) => `${item.assists} AST`}
                compact
              />
              <LeaderCard
                title="Steals"
                icon={<Target className="h-4 w-4 text-rose-400" />}
                items={getTopLeaders(basketballLeaders, "steals")}
                renderStat={(item) => `${item.steals} STL`}
                compact
              />
              <LeaderCard
                title="Blocks"
                icon={<Shield className="h-4 w-4 text-violet-400" />}
                items={getTopLeaders(basketballLeaders, "blocks")}
                renderStat={(item) => `${item.blocks} BLK`}
                compact
              />
            </div>

            <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontal className="h-4 w-4 text-gray-400" />
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Shooting Efficiency Metric Matrix</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <LeaderCard
                  title="Field Goal Percentage"
                  icon={<Target className="h-4 w-4 text-orange-400" />}
                  items={getBasketballPercentageLeaders(basketballLeaders, "two_pointers_made", "two_pointers_attempted")}
                  renderStat={(item) => `${item.computed_pct.toFixed(1)}%`}
                  footnote="*Min 5 attempts"
                />
                <LeaderCard
                  title="3-Point Percentage"
                  icon={<Target className="h-4 w-4 text-yellow-400" />}
                  items={getBasketballPercentageLeaders(basketballLeaders, "three_pointers_made", "three_pointers_attempted")}
                  renderStat={(item) => `${item.computed_pct.toFixed(1)}%`}
                  footnote="*Min 5 attempts"
                />
                <LeaderCard
                  title="Free Throw Percentage"
                  icon={<Target className="h-4 w-4 text-pink-400" />}
                  items={getBasketballPercentageLeaders(basketballLeaders, "free_throws_made", "free_throws_attempted")}
                  renderStat={(item) => `${item.computed_pct.toFixed(1)}%`}
                  footnote="*Min 5 attempts"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LeaderCard({
  title,
  icon,
  items,
  renderStat,
  compact = false,
  footnote,
}: {
  title: string;
  icon: React.ReactNode;
  items: any[];
  renderStat: (item: any) => string;
  compact?: boolean;
  footnote?: string;
}) {
  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-4 flex flex-col shadow-2xl relative overflow-hidden">
      <div className="flex items-center gap-2 mb-4 border-b border-gray-800/60 pb-2">
        {icon}
        <h3 className="font-bold text-xs tracking-wider uppercase text-gray-200">{title}</h3>
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-6 text-xs text-gray-500 italic">
          No entries found
        </div>
      ) : (
        <div className="space-y-2 flex-1">
          {items.map((item, idx) => {
            const p = item.player;
            const isFirst = idx === 0;
            return (
              <div key={p?.id || idx} className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-gray-800/40 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`text-xs font-black w-4 text-center ${isFirst ? "text-amber-400" : "text-gray-500"}`}>
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate leading-none">{p?.name || "Player"}</p>
                    {!compact && (
                      <p className="text-[11px] text-gray-400 truncate mt-1">
                        {p?.team?.short_name || "FA"} · #{p?.jersey_number ?? "00"}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Premium Podium Badge Treatment */}
                <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-lg border shrink-0 transition-all ${
                  isFirst 
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.1)]" 
                    : "bg-[#0B0F19] text-gray-300 border-gray-800"
                }`}>
                  {renderStat(item)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {footnote && (
        <span className="text-[10px] text-gray-500 mt-2 block text-right font-medium italic">{footnote}</span>
      )}
    </div>
  );
}