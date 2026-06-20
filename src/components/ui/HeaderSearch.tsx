"use client";

import { useState, useEffect } from "react";
import { Search, X, Star, Trophy, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function HeaderSearch() {
  const router = useRouter();
  const supabase = createClient();
  
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statsData, setStatsData] = useState<any[]>([]);

  // Pre-fetch live data when search modal initializes
  useEffect(() => {
    if (!isOpen) return;
    
    async function fetchSearchPool() {
      const { data } = await supabase
        .from("player_stats")
        .select(`
          *,
          player:players(
            id,
            name,
            jersey_number,
            position,
            sport:sports(slug, name),
            team:teams(id, name, short_name)
          )
        `);
      if (data) setStatsData(data);
    }
    fetchSearchPool();
  }, [isOpen, supabase]);

  // Handle ESC key to exit overlay cleanly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter pool based on character string match
  const filteredResults = query.trim() === "" 
    ? [] 
    : statsData.filter((item) => {
        const p = item.player;
        return (
          p?.name?.toLowerCase().includes(query.toLowerCase()) ||
          p?.team?.name?.toLowerCase().includes(query.toLowerCase()) ||
          p?.team?.short_name?.toLowerCase().includes(query.toLowerCase())
        );
      }).slice(0, 6);

  return (
    <>
      {/* 1. Header Trigger Button (Only an SVG icon) */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800/50 transition-colors focus:outline-none"
        aria-label="Open global performance search"
      >
        <Search className="h-5 w-5 stroke-[2.5]" />
      </button>

      {/* 2. Full Screen HUD Search Overlay Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B0F19]/95 backdrop-blur-md flex flex-col items-center pt-24 px-4 animate-in fade-in duration-150">
          
          {/* Close Area Trigger & Button Header */}
          <div className="w-full max-w-2xl flex justify-end mb-4">
            <button 
              onClick={() => { setIsOpen(false); setQuery(""); }}
              className="text-gray-400 hover:text-white flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest bg-[#111827] border border-gray-800 px-3 py-2 rounded-xl"
            >
              Close <X className="h-4 w-4" />
            </button>
          </div>

          {/* Dynamic Core Search Frame */}
          <div className="w-full max-w-2xl bg-[#111827] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center gap-3">
              <Search className="h-5 w-5 text-amber-500 shrink-0" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type player names, specific clubs, or stats details..."
                className="w-full bg-transparent text-white font-medium placeholder-gray-500 outline-none text-base"
              />
            </div>

            {/* Results Mapping List Area */}
            <div className="max-h-[400px] overflow-y-auto p-2">
              {query.trim() === "" ? (
                <div className="py-12 text-center">
                  <Trophy className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-medium">Looking for data? Start typing to scan active records.</p>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500 italic">
                  No direct metric profiles matched your search string.
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredResults.map((item) => {
                    const p = item.player;
                    const isFootball = p?.sport?.slug === "football";
                    
                    return (
                      <div
                        key={p?.id}
                        onClick={() => {
                          setIsOpen(false);
                          setQuery("");
                          router.push(`/leaders?sport=${p?.sport?.slug}`);
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-800/60 transition-colors group cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                              {p?.name}
                            </span>
                            <span className="text-[10px] font-black uppercase bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                              {p?.sport?.name}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 truncate mt-1">
                            {p?.team?.short_name} · #{p?.jersey_number ?? "00"} ({p?.position})
                          </p>
                        </div>

                        {/* Top Performance Stats Display */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-xs font-mono font-black text-gray-200 bg-[#0B0F19] px-2.5 py-1 rounded-lg border border-gray-800 inline-block">
                              {isFootball 
                                ? `${item.goals} Goals · ${item.assists} Ast`
                                : `${(item.two_pointers_made * 2) + (item.three_pointers_made * 3) + item.free_throws_made} PTS`
                              }
                            </span>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}