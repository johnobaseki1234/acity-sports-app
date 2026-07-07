import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Radio, CalendarDays, Shield, CalendarRange, ArrowRight, type LucideIcon } from "lucide-react";
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
    <div className="space-y-7">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage live scoring, teams, seasons and fixtures.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard Icon={Radio} label="Live Now" value={live.length} highlight={live.length > 0} />
        <StatCard Icon={CalendarDays} label="Today" value={upcoming.length} />
        <StatCard Icon={Shield} label="Teams" value={teamCount ?? 0} />
        <StatCard Icon={CalendarRange} label="Seasons" value={seasonCount ?? 0} />
      </div>

      {live.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3.5">
            <Radio className="h-5 w-5 text-vanguard-volt animate-pulse" /> Live Matches
          </h2>
          <div className="space-y-3">
            {live.map((m) => <MatchRow key={m.id} match={m} />)}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3.5">
            <CalendarDays className="h-5 w-5 text-vanguard-volt" /> Today&apos;s Matches
          </h2>
          <div className="space-y-3">
            {upcoming.map((m) => <MatchRow key={m.id} match={m} />)}
          </div>
        </section>
      )}

      {live.length === 0 && upcoming.length === 0 && (
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl py-14 text-center shadow-lg">
          <div className="mx-auto mb-3 grid place-items-center h-16 w-16 rounded-3xl bg-vanguard-volt/10 text-vanguard-volt">
            <CalendarDays className="h-8 w-8" strokeWidth={1.75} />
          </div>
          <p className="font-medium text-zinc-500 dark:text-zinc-400">No live or upcoming matches today.</p>
          <Link href="/admin/matches/new" className="btn-primary mt-5 inline-flex gap-2">
            Schedule a match <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({
  Icon,
  label,
  value,
  highlight,
}: {
  Icon: LucideIcon;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-5 shadow-lg backdrop-blur-xl transition-all ${
        highlight
          ? "bg-vanguard-volt border-vanguard-volt text-black"
          : "bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <Icon className={`h-5 w-5 ${highlight ? "text-black/80" : "text-vanguard-volt"}`} strokeWidth={2.25} />
      <div className={`mt-2 text-3xl font-black tabular-nums ${highlight ? "text-black" : "text-zinc-900 dark:text-white"}`}>
        {value}
      </div>
      <div className={`text-xs font-semibold uppercase tracking-wide mt-0.5 ${highlight ? "text-black/70" : "text-zinc-500 dark:text-zinc-400"}`}>
        {label}
      </div>
    </div>
  );
}

function MatchRow({ match }: { match: Match }) {
  const isLive = match.status === "live" || match.status === "halftime";
  return (
    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
      <div className="flex-1 text-sm min-w-0">
        <span className="font-bold text-zinc-900 dark:text-white">{match.home_team?.short_name}</span>
        <span className="text-zinc-400 mx-2">vs</span>
        <span className="font-bold text-zinc-900 dark:text-white">{match.away_team?.short_name}</span>
        {isLive ? (
          <span className="ml-2 text-vanguard-volt font-black tabular-nums">
            {match.home_score} – {match.away_score}
          </span>
        ) : (
          <span className="ml-2 text-zinc-400 text-xs">
            {formatMatchDate(match.scheduled_at)} {formatMatchTime(match.scheduled_at)}
          </span>
        )}
      </div>
      <Link href={`/scorer/${match.id}`} className="btn-primary text-xs h-10 px-4 shrink-0">
        {isLive ? "Continue" : "Score"}
      </Link>
    </div>
  );
}
