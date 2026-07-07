import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, CalendarRange } from "lucide-react";
import { SportIcon } from "@/components/ui/SportIcon";
import type { Match } from "@/lib/supabase/types";
import { formatMatchDate, formatMatchTime } from "@/lib/utils/match";

const MATCH_SELECT = `*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*), season:seasons(*, sport:sports(*))`;

export default async function MatchesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("matches")
    .select(MATCH_SELECT)
    .order("scheduled_at", { ascending: false })
    .limit(50);
  const matches = (data ?? []) as Match[];

  const statusColors: Record<string, string> = {
    live: "text-vanguard-volt dark:text-vanguard-volt bg-vanguard-volt/10 dark:bg-vanguard-volt/20",
    halftime: "text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-500/20",
    finished: "text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-500/20",
    scheduled: "text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-500/20",
    postponed: "text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-500/20",
    cancelled: "text-zinc-400 bg-zinc-100 dark:bg-zinc-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Matches</h1>
        <Link href="/admin/matches/new" className="btn-primary gap-2"><Plus className="h-4 w-4" /> Schedule</Link>
      </div>

      {matches.length === 0 ? (
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl py-14 text-center shadow-lg">
          <div className="mx-auto mb-3 grid place-items-center h-16 w-16 rounded-3xl bg-vanguard-volt/10 text-vanguard-volt">
            <CalendarRange className="h-8 w-8" strokeWidth={1.75} />
          </div>
          <p className="text-zinc-500 dark:text-zinc-400">No matches scheduled yet.</p>
        </div>
      ) : (
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl divide-y divide-zinc-100 dark:divide-zinc-800 shadow-lg overflow-hidden">
          {matches.map((m) => (
            <div key={m.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                  {m.home_team?.short_name} vs {m.away_team?.short_name}
                  {(m.status === "live" || m.status === "halftime" || m.status === "finished") && (
                    <span className="ml-2 font-black text-vanguard-volt dark:text-vanguard-volt tabular-nums">
                      {m.home_score}–{m.away_score}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                  <SportIcon slug={m.season?.sport?.slug} className="h-3.5 w-3.5" /> {m.season?.name} · {formatMatchDate(m.scheduled_at)} {formatMatchTime(m.scheduled_at)} · {m.venue}
                </div>
              </div>
              <span className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full shrink-0 ${statusColors[m.status] ?? "text-zinc-400"}`}>
                {m.status}
              </span>
              <div className="flex gap-3 shrink-0">
                <Link href={`/match/${m.id}`} className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:underline">
                  View
                </Link>
                {(m.status === "scheduled" || m.status === "live" || m.status === "halftime") && (
                  <Link href={`/scorer/${m.id}`} className="text-xs font-semibold text-vanguard-volt dark:text-vanguard-volt hover:underline">
                    Score
                  </Link>
                )}
                <Link href={`/admin/matches/${m.id}`} className="text-xs font-medium text-zinc-400 hover:underline">
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
