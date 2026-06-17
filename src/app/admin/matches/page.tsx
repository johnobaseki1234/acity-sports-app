import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
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
    live: "text-red-600 bg-red-50",
    halftime: "text-orange-600 bg-orange-50",
    finished: "text-gray-400 bg-gray-50",
    scheduled: "text-blue-600 bg-blue-50",
    postponed: "text-yellow-600 bg-yellow-50",
    cancelled: "text-gray-400 bg-gray-50",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Matches</h1>
        <Link href="/admin/matches/new" className="btn-primary">+ Schedule Match</Link>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">🗓️</div>
          <p>No matches scheduled yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
          {matches.map((m) => (
            <div key={m.id} className="flex items-center gap-4 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {m.home_team?.short_name} vs {m.away_team?.short_name}
                  {(m.status === "live" || m.status === "halftime" || m.status === "finished") && (
                    <span className="ml-2 font-bold">
                      {m.home_score}–{m.away_score}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  {m.season?.sport?.icon} {m.season?.name} · {formatMatchDate(m.scheduled_at)} {formatMatchTime(m.scheduled_at)} · {m.venue}
                </div>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusColors[m.status] ?? "text-gray-400"}`}>
                {m.status}
              </span>
              <div className="flex gap-2 shrink-0">
                <Link href={`/match/${m.id}`} className="text-xs text-gray-500 hover:underline">
                  View
                </Link>
                {(m.status === "scheduled" || m.status === "live" || m.status === "halftime") && (
                  <Link href={`/scorer/${m.id}`} className="text-xs text-brand-blue font-medium hover:underline">
                    Score
                  </Link>
                )}
                <Link href={`/admin/matches/${m.id}`} className="text-xs text-gray-400 hover:underline">
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
