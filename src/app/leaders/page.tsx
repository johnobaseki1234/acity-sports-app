"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { SportIcon } from "@/components/ui/SportIcon";
import { Trophy, Shield, Zap, Target, Star, SlidersHorizontal } from "lucide-react";

export default function LeagueLeadersPage() {
  const supabase = createClient();
  const [statsData, setStatsData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "football" | "basketball">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const { data, error } = await supabase
        .from("player_stats")
        .select("*");

      if (!error && data) setStatsData(data);
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

  const footballLeaders = statsData.filter((s) => s.sport_slug === "football");
  const basketballLeaders = statsData.filter((s) => s.sport_slug === "basketball");

  const getTopLeaders = (list: any[], key: string, limit = 5) =>
    [...list]
      .filter((a) => (a[key] ?? 0) > 0)
      .sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0))
      .slice(0, limit);

  const getPercentageLeaders = (list: any[], madeKey: string, attKey: string, limit = 5) =>
    [...list]
      .filter((a) => (a[attKey] ?? 0) >= 5)
      .map((item) => ({ ...item, computed_pct: ((item[madeKey] ?? 0) / (item[attKey] ?? 1)) * 100 }))
      .sort((a, b) => b.computed_pct - a.computed_pct)
      .slice(0, limit);

  const getTotalPoints = (list: any[], limit = 5) =>
    [...list]
      .map((item) => ({
        ...item,
        total_points: (item.two_pointers_made * 2) + (item.three_pointers_made * 3) + item.free_throws_made,
      }))
      .filter((a) => a.total_points > 0)
      .sort((a, b) => b.total_points - a.total_points)
      .slice(0, limit);

    const dummyLeaders = [
  { 
    player_name: "Alex Johnson", 
    goals: 12, 
    assists: 5, 
    player: { name: "Alex Johnson", jersey_number: "10", position: "Forward", team: { name: "Varsity Lions", logo_url: "/lions.png" } } 
  },
  { 
    player_name: "Marcus Green", 
    goals: 9, 
    assists: 8, 
    player: { name: "Marcus Green", jersey_number: "23", position: "Midfielder", team: { name: "Varsity Lions", logo_url: "/lions.png" } } 
  }
];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto mb-8 border-b border-gray-800 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <Trophy className="h-8 w-8 text-amber-500 shrink-0" /> LEAGUE LEADERS
          </h1>
          <p className="text-sm text-gray-400 mt-1">Real-time performance analytics across active divisions.</p>
        </div>
        <div className="flex bg-[#111827] border border-gray-800 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          {(["all", "football", "basketball"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === tab
                  ? tab === "football" ? "bg-emerald-600 text-white"
                  : tab === "basketball" ? "bg-amber-600 text-white"
                  : "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab !== "all" && <SportIcon slug={tab} className="h-3.5 w-3.5" />}
              {tab === "all" ? "All Sports" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-12">
        {/* FOOTBALL */}
        {(activeTab === "all" || activeTab === "football") && (
          <div className="animate-in fade-in duration-200">
            <div className="flex items-center gap-2 mb-6 border-l-4 border-emerald-500 pl-3">
              <SportIcon slug="football" className="h-5 w-5 text-emerald-400" />
              <h2 className="text-xl font-bold tracking-wide uppercase text-white">Football Leaders</h2>
            </div>
            {footballLeaders.length === 0 ? (
              <p className="text-gray-500 text-sm">No football stats yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <LeaderCard title="Top Goalscorers" icon={<Star className="h-4 w-4 text-emerald-400" />}
                  items={getTopLeaders(footballLeaders, "goals")} renderStat={(i) => `${i.goals} G`} />
                <LeaderCard title="Assists" icon={<Zap className="h-4 w-4 text-sky-400" />}
                  items={getTopLeaders(footballLeaders, "assists")} renderStat={(i) => `${i.assists} A`} />
                <LeaderCard title="Goalkeeper Saves" icon={<Shield className="h-4 w-4 text-purple-400" />}
                  items={getTopLeaders(footballLeaders, "saves")} renderStat={(i) => `${i.saves} SV`} />
              </div>
            )}
          </div>
        )}

        {/* BASKETBALL */}
        {(activeTab === "all" || activeTab === "basketball") && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 mb-2 border-l-4 border-amber-500 pl-3">
              <SportIcon slug="basketball" className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-bold tracking-wide uppercase text-white">Basketball Leaders</h2>
            </div>
            {basketballLeaders.length === 0 ? (
              <p className="text-gray-500 text-sm">No basketball stats yet.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <LeaderCard title="Points" icon={<Star className="h-4 w-4 text-amber-400" />}
                    items={getTotalPoints(basketballLeaders)} renderStat={(i) => `${i.total_points} PTS`} compact />
                  <LeaderCard title="Rebounds" icon={<Shield className="h-4 w-4 text-teal-400" />}
                    items={getTopLeaders(basketballLeaders, "rebounds")} renderStat={(i) => `${i.rebounds} REB`} compact />
                  <LeaderCard title="Assists" icon={<Zap className="h-4 w-4 text-cyan-400" />}
                    items={getTopLeaders(basketballLeaders, "assists")} renderStat={(i) => `${i.assists} AST`} compact />
                  <LeaderCard title="Steals" icon={<Target className="h-4 w-4 text-rose-400" />}
                    items={getTopLeaders(basketballLeaders, "steals")} renderStat={(i) => `${i.steals} STL`} compact />
                  <LeaderCard title="Blocks" icon={<Shield className="h-4 w-4 text-violet-400" />}
                    items={getTopLeaders(basketballLeaders, "blocks")} renderStat={(i) => `${i.blocks} BLK`} compact />
                </div>

                <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <SlidersHorizontal className="h-4 w-4 text-gray-400" />
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Shooting Efficiency</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <LeaderCard title="2PT Field Goal %" icon={<Target className="h-4 w-4 text-orange-400" />}
                      items={getPercentageLeaders(basketballLeaders, "two_pointers_made", "two_pointers_attempted")}
                      renderStat={(i) => `${i.computed_pct.toFixed(1)}%`} footnote="*Min 5 attempts" />
                    <LeaderCard title="3-Point %" icon={<Target className="h-4 w-4 text-yellow-400" />}
                      items={getPercentageLeaders(basketballLeaders, "three_pointers_made", "three_pointers_attempted")}
                      renderStat={(i) => `${i.computed_pct.toFixed(1)}%`} footnote="*Min 5 attempts" />
                    <LeaderCard title="Free Throw %" icon={<Target className="h-4 w-4 text-pink-400" />}
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

function LeaderCard({ title, icon, items, renderStat, compact = false, footnote }: {
  title: string; icon: React.ReactNode; items: any[];
  renderStat: (item: any) => string; compact?: boolean; footnote?: string;
}) {
  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-4 flex flex-col shadow-2xl">
      <div className="flex items-center gap-2 mb-4 border-b border-gray-800/60 pb-2">
        {icon}
        <h3 className="font-bold text-xs tracking-wider uppercase text-gray-200">{title}</h3>
      </div> 

      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-6 text-xs text-gray-500 italic">No entries yet</div>
      ) : (
        <div className="space-y-2 flex-1">
          {items.map((item, idx) => {
            const isFirst = idx === 0;
            return (
              <div key={item.player_id || idx} className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-gray-800/40 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`text-xs font-black w-4 text-center ${isFirst ? "text-amber-400" : "text-gray-500"}`}>{idx + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate leading-none">{item.player_name || "Player"}</p>
                    {!compact && (
                      <p className="text-[11px] text-gray-400 truncate mt-1">
                        {item.team_short_name || "FA"} · #{item.jersey_number ?? "00"}
                      </p>
                    )}
                  </div>
                </div>
                <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-lg border shrink-0 ${
                  isFirst ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-[#0B0F19] text-gray-300 border-gray-800"
                }`}>
                  {renderStat(item)}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {footnote && <span className="text-[10px] text-gray-500 mt-2 block text-right italic">{footnote}</span>}
    </div>
  );
}