"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Clock } from "lucide-react";
import type { School, Season } from "@/lib/supabase/types";
import { useLeagueOfInterest } from "@/hooks/useLeagueOfInterest";
import { leagueTagLabel } from "@/lib/utils/leagueLabel";
import { SportIcon } from "@/components/ui/SportIcon";

type Props = { schools: School[]; seasons: Season[] };

export function OnboardingGrid({ schools, seasons }: Props) {
  const router = useRouter();
  const { leagueIds, saveSelection } = useLeagueOfInterest();
  const [selected, setSelected] = useState<string[]>(leagueIds);

  function toggle(seasonId: string) {
    setSelected((prev) =>
      prev.includes(seasonId) ? prev.filter((id) => id !== seasonId) : [...prev, seasonId]
    );
  }

  function finish() {
    saveSelection(selected);
    router.push("/");
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="text-center mb-8">
        <div className="mx-auto mb-3 grid place-items-center h-16 w-16 rounded-2xl bg-black shadow-lg shadow-vanguard-volt/10 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/vanguard-logo.png" alt="VANGUARD" className="h-full w-full object-cover" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white">Pick Your Allegiances</h1>
        <p className="text-sm text-zinc-400 mt-2 max-w-md mx-auto">
          Choose the leagues you follow. Your home feed, fixtures, and standings will show these first.
        </p>
      </div>

      <div className="space-y-5">
        {schools.map((school) => {
          const schoolSeasons = seasons.filter((s) => s.school_id === school.id);
          return (
            <div
              key={school.id}
              className="rounded-2xl border border-white/10 bg-zinc-900/70 overflow-hidden"
            >
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/10 bg-white/[0.03]">
                <span
                  className="grid place-items-center h-7 w-7 rounded-lg text-[10px] font-black text-white shrink-0"
                  style={{ background: school.primary_color }}
                >
                  {school.short_name}
                </span>
                <h2 className="text-sm font-black text-white">{school.name}</h2>
              </div>

              {schoolSeasons.length === 0 ? (
                <div className="flex items-center gap-2 px-4 py-4 text-zinc-500">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-semibold">Leagues launching soon</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
                  {schoolSeasons.map((season) => {
                    const isSelected = selected.includes(season.id);
                    return (
                      <button
                        key={season.id}
                        type="button"
                        onClick={() => toggle(season.id)}
                        className={`relative flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all active:scale-95 ${
                          isSelected
                            ? "border-vanguard-volt bg-vanguard-volt/10"
                            : "border-white/10 bg-white/[0.02] hover:border-white/25"
                        }`}
                      >
                        <SportIcon
                          slug={season.sport?.slug}
                          className={`h-4 w-4 shrink-0 ${isSelected ? "text-vanguard-volt" : "text-zinc-500"}`}
                        />
                        <span className={`text-xs font-bold truncate ${isSelected ? "text-white" : "text-zinc-300"}`}>
                          {leagueTagLabel(season)}
                        </span>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-vanguard-volt ml-auto shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={finish}
        className="w-full mt-6 h-12 rounded-2xl bg-vanguard-volt text-black font-black hover:bg-vanguard-volt/90 transition active:scale-95"
      >
        {selected.length === 0 ? "Skip for now" : `Continue with ${selected.length} league${selected.length === 1 ? "" : "s"}`}
      </button>
    </div>
  );
}
