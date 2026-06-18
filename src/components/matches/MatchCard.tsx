import Link from "next/link";
import type { Match } from "@/lib/supabase/types";
import { formatMatchTime } from "@/lib/utils/match";

type Props = { match: Match };

export function MatchCard({ match }: Props) {
  const isLive = match.status === "live" || match.status === "halftime";
  const isFinished = match.status === "finished";
  const showScore = isLive || isFinished;

  return (
    <Link
      href={`/match/${match.id}`}
      className={`group relative block glass rounded-3xl p-4 sm:p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${
        isLive ? "ring-1 ring-red-500/30 live-glow" : "hover:border-blue-300/60"
      }`}
    >
      {/* Team-colour accent bar */}
      <div className="absolute left-0 top-5 bottom-5 w-1 rounded-full overflow-hidden flex flex-col">
        <span className="flex-1" style={{ background: match.home_team?.primary_color ?? "#3b82f6" }} />
        <span className="flex-1" style={{ background: match.away_team?.primary_color ?? "#6366f1" }} />
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between mb-3 pl-3">
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-zinc-500 truncate">
          <span className="text-sm">{match.season?.sport?.icon}</span>
          <span className="truncate">{match.season?.name}</span>
          {match.matchday ? <span className="text-gray-300 dark:text-zinc-600">· MD{match.matchday}</span> : null}
        </span>
        <StatusBadge match={match} />
      </div>

      {/* Score row */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3 pl-3">
        <TeamSide team={match.home_team} />

        <div className="text-center px-1 shrink-0">
          {showScore ? (
            <div
              className={`text-4xl sm:text-5xl font-black tracking-tight tabular-nums leading-none ${
                isLive ? "text-red-600 dark:text-red-500" : "text-gray-900 dark:text-white"
              }`}
            >
              {match.home_score}
              <span className="text-gray-300 dark:text-zinc-600 mx-1 sm:mx-1.5 font-light">–</span>
              {match.away_score}
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 text-sm font-bold text-gray-600 dark:text-zinc-300 tabular-nums whitespace-nowrap">
              {formatMatchTime(match.scheduled_at)}
            </div>
          )}
        </div>

        <TeamSide team={match.away_team} />
      </div>

      {/* Venue */}
      {match.venue && (
        <div className="mt-3 pl-3 text-center text-[11px] font-medium text-gray-400 dark:text-zinc-500">
          📍 {match.venue}
        </div>
      )}
    </Link>
  );
}

function TeamSide({
  team,
}: {
  team?: { name: string; short_name: string; primary_color: string };
}) {
  return (
    <div className="min-w-0 flex flex-col items-center gap-2 text-center">
      <span
        className="grid place-items-center h-12 w-12 shrink-0 rounded-2xl text-xs font-black text-white shadow-md"
        style={{ background: team?.primary_color ?? "#64748b" }}
      >
        {team?.short_name?.slice(0, 3).toUpperCase()}
      </span>
      <span className="block w-full font-bold text-xs sm:text-sm text-gray-900 dark:text-white leading-tight truncate">
        {team?.name ?? team?.short_name}
      </span>
    </div>
  );
}

function StatusBadge({ match }: { match: Match }) {
  const sportSlug = match.season?.sport?.slug;

  if (match.status === "live") {
    const isOT = sportSlug === "basketball" && match.current_period > 4;
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold px-2.5 py-1 shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
        LIVE{isOT ? ` · OT${match.current_period - 4}` : ""}
      </span>
    );
  }
  if (match.status === "halftime") {
    const label =
      sportSlug === "basketball" ? "BREAK" : sportSlug === "volleyball" ? "SET BREAK" : "HT";
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 text-white text-[11px] font-bold px-2.5 py-1">
        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
        {label}
      </span>
    );
  }
  if (match.status === "finished") {
    return (
      <span className="rounded-full bg-emerald-500/90 text-white text-[11px] font-bold px-2.5 py-1">
        FULL TIME
      </span>
    );
  }
  if (match.status === "postponed") {
    return <span className="rounded-full bg-gray-400 text-white text-[11px] font-bold px-2.5 py-1">PPD</span>;
  }
  return (
    <span className="rounded-full bg-blue-600/90 text-white text-[11px] font-bold px-2.5 py-1">UPCOMING</span>
  );
}
