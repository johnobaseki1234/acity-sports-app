import { createClient } from "@/lib/supabase/server";
import { Network } from "lucide-react";
import type { School, Season, Sport } from "@/lib/supabase/types";
import { NewSchoolForm, NewLeagueForm } from "@/components/admin/NetworkManagerForms";

export default async function NetworkManagerPage() {
  const supabase = await createClient();

  const [{ data: schools }, { data: sports }, { data: seasons }] = await Promise.all([
    supabase.from("schools").select("*").order("name"),
    supabase.from("sports").select("*").order("name"),
    supabase.from("seasons").select("*, sport:sports(*), school:schools(*)").order("created_at", { ascending: false }),
  ]);

  const schoolList = (schools ?? []) as School[];
  const seasonList = (seasons ?? []) as Season[];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <Network className="h-7 w-7 text-vanguard-volt" strokeWidth={2} />
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Network Manager</h1>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 -mt-4">
        Provision new schools and leagues into the platform. Anything created here immediately grows the
        pool available on the onboarding screen.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NewSchoolForm />
        <NewLeagueForm schools={schoolList} sports={(sports ?? []) as Sport[]} />
      </div>

      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-lg">
        <h2 className="px-5 pt-4 pb-2 font-bold text-sm text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          Network — {schoolList.length} Schools · {seasonList.length} Leagues
        </h2>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {schoolList.map((school) => {
            const schoolSeasons = seasonList.filter((s) => s.school_id === school.id);
            return (
              <div key={school.id} className="px-5 py-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <span
                    className="grid place-items-center h-6 w-6 rounded-lg text-[9px] font-black text-white shrink-0"
                    style={{ background: school.primary_color }}
                  >
                    {school.short_name}
                  </span>
                  <span className="font-bold text-sm text-zinc-900 dark:text-white">{school.name}</span>
                </div>
                {schoolSeasons.length === 0 ? (
                  <p className="text-xs text-zinc-400 pl-8">No leagues yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2 pl-8">
                    {schoolSeasons.map((season) => (
                      <span
                        key={season.id}
                        className={`text-xs font-bold px-2 py-1 rounded-lg border ${
                          season.is_active
                            ? "bg-vanguard-volt/10 text-vanguard-volt border-vanguard-volt/25"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700"
                        }`}
                      >
                        {season.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
