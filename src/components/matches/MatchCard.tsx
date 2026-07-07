import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Match } from "@/lib/supabase/types";
import { formatMatchTime } from "@/lib/utils/match";
import { SportIcon } from "@/components/ui/SportIcon";

type Props = { match: Match };

export function MatchCard({ match }: Props) {
  const isLive = match.status === "live" || match.status === "halftime";
  const isFinished = match.status === "finished";
  const showScore = isLive || isFinished;

  return (
    <Link
      href={`/match/${match.id}`}
      className={`group relative block bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border rounded-3xl p-4 sm:p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
        isLive
          ? "border-vanguard-volt/40 live-glow"
          : "border-zinc-200 dark:border-zinc-800 hover:border-vanguard-volt/40"
      }`}
    >
      {/* Team-colour accent bar */}
      <div className="absolute left-0 top-5 bottom-5 w-1 rounded-full overflow-hidden flex flex-col">
        <span className="flex-1" style={{ background: match.home_team?.primary_color ?? "#dc2626" }} />
        <span className="flex-1" style={{ background: match.away_team?.primary_color ?? "#991b1b" }} />
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between mb-3 pl-3">
        <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 dark:text-zinc-500 truncate">
          <SportIcon slug={match.season?.sport?.slug} className="h-4 w-4 shrink-0" />
          <span className="truncate">{match.season?.name}</span>
          {match.matchday ? <span className="text-zinc-300 dark:text-zinc-600">· MD{match.matchday}</span> : null}
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
                isLive ? "text-vanguard-volt dark:text-vanguard-volt" : "text-zinc-900 dark:text-white"
              }`}
            >
              {match.home_score}
              <span className="text-zinc-300 dark:text-zinc-600 mx-1 sm:mx-1.5 font-light">–</span>
              {match.away_score}
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 text-sm font-bold text-zinc-600 dark:text-zinc-300 tabular-nums whitespace-nowrap">
              {formatMatchTime(match.scheduled_at)}
            </div>
          )}
        </div>

        <TeamSide team={match.away_team} />
      </div>

      {/* Venue */}
      {match.venue && (
        <div className="mt-3 pl-3 flex items-center justify-center gap-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
          <MapPin className="h-3 w-3" /> {match.venue}
        </div>
      )}
    </Link>
  );
}

function TeamSide({ team }: { team?: { name: string; short_name: string; primary_color: string } }) {
  return (
    <div className="min-w-0 flex flex-col items-center gap-2 text-center">
      <span
        className="grid place-items-center h-12 w-12 shrink-0 rounded-2xl text-xs font-black text-white shadow-md"
        style={{ background: team?.primary_color ?? "#52525b" }}
      >
        {team?.short_name?.slice(0, 3).toUpperCase()}
      </span>
      <span className="block w-full font-bold text-xs sm:text-sm text-zinc-900 dark:text-white leading-tight truncate">
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
      <span className="inline-flex items-center gap-1.5 rounded-full bg-vanguard-volt/10 dark:bg-vanguard-volt/20 text-vanguard-volt dark:text-vanguard-volt text-[11px] font-bold px-2.5 py-1 animate-pulse">
        <span className="h-1.5 w-1.5 rounded-full bg-vanguard-volt dark:bg-vanguard-volt" />
        LIVE{isOT ? ` · OT${match.current_period - 4}` : ""}
      </span>
    );
  }
  if (match.status === "halftime") {
    const label = sportSlug === "basketball" ? "BREAK" : sportSlug === "volleyball" ? "SET BREAK" : "HT";
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-bold px-2.5 py-1">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        {label}
      </span>
    );
  }
  if (match.status === "finished") {
    return (
      <span className="rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 text-[11px] font-bold px-2.5 py-1">
        FINISHED
      </span>
    );
  }
  if (match.status === "postponed") {
    return <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[11px] font-bold px-2.5 py-1">PPD</span>;
  }
  return (
    <span className="rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[11px] font-bold px-2.5 py-1">
      UPCOMING
    </span>
  );
}
