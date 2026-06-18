import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, CalendarRange } from "lucide-react";
import { SportIcon } from "@/components/ui/SportIcon";
import type { Season } from "@/lib/supabase/types";

export default async function SeasonsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("seasons")
    .select("*, sport:sports(*)")
    .order("created_at", { ascending: false });
  const seasons = (data ?? []) as Season[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Seasons &amp; Leagues</h1>
        <Link href="/admin/seasons/new" className="btn-primary gap-2"><Plus className="h-4 w-4" /> New Season</Link>
      </div>

      {seasons.length === 0 ? (
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl py-14 text-center shadow-lg">
          <div className="mx-auto mb-3 grid place-items-center h-16 w-16 rounded-3xl bg-red-500/10 text-red-600 dark:text-red-500">
            <CalendarRange className="h-8 w-8" strokeWidth={1.75} />
          </div>
          <p className="text-zinc-500 dark:text-zinc-400">No seasons yet. Create one to start scheduling matches.</p>
        </div>
      ) : (
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl divide-y divide-zinc-100 dark:divide-zinc-800 shadow-lg overflow-hidden">
          {seasons.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <div className="font-bold text-sm flex items-center gap-2 text-zinc-900 dark:text-white">
                  <SportIcon slug={s.sport?.slug} className="h-4 w-4 text-red-600 dark:text-red-500" /> {s.name}
                  {s.is_active && (
                    <span className="text-[11px] font-bold bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">Active</span>
                  )}
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  {new Date(s.start_date).toLocaleDateString()} – {new Date(s.end_date).toLocaleDateString()}
                </div>
              </div>
              <Link href={`/admin/seasons/${s.id}`} className="text-sm font-semibold text-red-600 dark:text-red-500 hover:underline">
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
