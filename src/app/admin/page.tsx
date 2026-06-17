import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Match } from "@/lib/supabase/types";
import { formatMatchTime, formatMatchDate } from "@/lib/utils/match";

const MATCH_SELECT = `*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*), season:seasons(*, sport:sports(*))`;

export default async function AdminDashboard() {
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [{ data: liveMatches }, { data: todayMatches }, { count: teamCount }, { count: seasonCount }] =
    await Promise.all([
      supabase.from("matches").select(MATCH_SELECT).in("status", ["live", "halftime"]),
      supabase
        .from("matches")
        .select(MATCH_SELECT)
        .gte("scheduled_at", today.toISOString())
        .lt("scheduled_at", tomorrow.toISOString())
        .eq("status", "scheduled")
        .order("scheduled_at"),
      supabase.from("teams").select("id", { count: "exact", head: true }),
      supabase.from("seasons").select("id", { count: "exact", head: true }),
    ]);

  const live = (liveMatches ?? []) as Match[];
  const upcoming = (todayMatches ?? []) as Match[];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Live Now" value={live.length} accent="red" />
        <StatCard label="Today" value={upcoming.length} accent="blue" />
        <StatCard label="Teams" value={teamCount ?? 0} accent="gray" />
        <StatCard label="Seasons" value={seasonCount ?? 0} accent="gray" />
      </div>

      {/* Live matches */}
      {live.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">🔴 Live Matches</h2>
          <div className="space-y-2">
            {live.map((m) => (
              <MatchRow key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* Today's upcoming */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">📅 Today&apos;s Matches</h2>
          <div className="space-y-2">
            {upcoming.map((m) => (
              <MatchRow key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {live.length === 0 && upcoming.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>No live or upcoming matches today.</p>
          <Link href="/admin/matches/new" className="btn-primary inline-block mt-4">
            Schedule a match
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  const colors: Record<string, string> = {
    red: "text-red-600 bg-red-50",
    blue: "text-blue-700 bg-blue-50",
    gray: "text-gray-700 bg-gray-100",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className={`text-3xl font-bold ${colors[accent]?.split(" ")[0]}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function MatchRow({ match }: { match: Match }) {
  const isLive = match.status === "live" || match.status === "halftime";
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-4">
      <div className="flex-1 text-sm">
        <span className="font-medium">{match.home_team?.short_name}</span>
        <span className="text-gray-400 mx-2">vs</span>
        <span className="font-medium">{match.away_team?.short_name}</span>
        {isLive && (
          <span className="ml-2 text-red-600 font-bold">
            {match.home_score} – {match.away_score}
          </span>
        )}
        {!isLive && (
          <span className="ml-2 text-gray-400 text-xs">
            {formatMatchDate(match.scheduled_at)} {formatMatchTime(match.scheduled_at)}
          </span>
        )}
      </div>
      <Link
        href={`/scorer/${match.id}`}
        className="btn-primary text-xs py-1.5 px-3 shrink-0"
      >
        {isLive ? "Continue" : "Score"}
      </Link>
    </div>
  );
}
