import Link from "next/link";
import type { Match } from "@/lib/supabase/types";
import { formatMatchTime, getStatusLabel } from "@/lib/utils/match";

type Props = { match: Match };

export function MatchCard({ match }: Props) {
  const isLive = match.status === "live" || match.status === "halftime";
  const isFinished = match.status === "finished";

  return (
    <Link href={`/match/${match.id}`} className="score-card block">
      {/* Sport + status row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400 font-medium">
          {match.season?.sport?.icon} {match.season?.name}
          {match.matchday ? ` · MD${match.matchday}` : ""}
        </span>
        <StatusBadge match={match} />
      </div>

      {/* Score row */}
      <div className="flex items-center justify-between gap-3">
        {/* Home team */}
        <div className="flex-1 text-right">
          <div className="font-semibold text-sm leading-tight">
            {match.home_team?.short_name ?? match.home_team?.name}
          </div>
        </div>

        {/* Score / time */}
        <div className="flex items-center gap-2 shrink-0">
          {isLive || isFinished ? (
            <div
              className={`text-2xl font-bold tabular-nums ${isLive ? "text-brand-red" : "text-gray-900"}`}
            >
              {match.home_score} – {match.away_score}
            </div>
          ) : (
            <div className="text-sm font-medium text-gray-500 text-center">
              {formatMatchTime(match.scheduled_at)}
            </div>
          )}
        </div>

        {/* Away team */}
        <div className="flex-1">
          <div className="font-semibold text-sm leading-tight">
            {match.away_team?.short_name ?? match.away_team?.name}
          </div>
        </div>
      </div>

      {/* Venue */}
      <div className="mt-2 text-xs text-gray-400 text-center">{match.venue}</div>
    </Link>
  );
}

function StatusBadge({ match }: { match: Match }) {
  const sportSlug = match.season?.sport?.slug;
  if (match.status === "live") {
    const isOT = sportSlug === "basketball" && match.current_period > 4;
    const otPeriod = match.current_period - 4;
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-red-600">
        <span className="live-dot" />
        LIVE {isOT && `(OT${otPeriod})`}
      </span>
    );
  }
  if (match.status === "halftime") {
    if (sportSlug === "basketball") {
      if (match.current_period >= 4 && match.home_score === match.away_score) {
        return (
          <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
            OT Break
          </span>
        );
      }
      return (
        <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
          Break
        </span>
      );
    }
    if (sportSlug === "volleyball") {
      return (
        <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
          Set Break
        </span>
      );
    }
    return (
      <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
        HT
      </span>
    );
  }
  if (match.status === "finished") {
    const isOT = sportSlug === "basketball" && match.current_period > 4;
    return (
      <span className="text-xs font-semibold text-gray-400">FT{isOT && "/OT"}</span>
    );
  }
  if (match.status === "postponed") {
    return (
      <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
        PPD
      </span>
    );
  }
  return <span className="text-xs text-gray-400">{getStatusLabel(match.status)}</span>;
}
