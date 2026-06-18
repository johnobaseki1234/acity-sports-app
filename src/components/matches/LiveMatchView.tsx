"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Radio, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Match, MatchEvent, Sport } from "@/lib/supabase/types";
import { computePeriodScores } from "@/lib/utils/periodScores";
import { EventLog } from "@/components/scorer/EventLog";
import { SportIcon } from "@/components/ui/SportIcon";
import { EventIcon } from "@/components/ui/EventIcon";
import { formatMatchDate, formatMatchTime, getStatusLabel } from "@/lib/utils/match";
import Link from "next/link";

type Props = { match: Match; initialEvents: MatchEvent[]; sport: Sport };

export function LiveMatchView({ match: initialMatch, initialEvents, sport }: Props) {
  const supabase = createClient();
  const [match, setMatch] = useState(initialMatch);
  const [events, setEvents] = useState<MatchEvent[]>(initialEvents);

  const isLive = match.status === "live" || match.status === "halftime";

  useEffect(() => {
    const channel = supabase
      .channel(`match-view-${match.id}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${match.id}`,
      }, (payload) => setMatch((prev) => ({ ...prev, ...payload.new })))
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "match_events", filter: `match_id=eq.${match.id}`,
      }, async (payload) => {
        const { data } = await supabase
          .from("match_events")
          .select("*, player:players!match_events_player_id_fkey(*), team:teams(*)")
          .eq("id", payload.new.id)
          .single();
        if (data) setEvents((prev) => [data as MatchEvent, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [match.id]);

  const periodLabel = () => {
    if (!sport) return "";
    if (sport.slug === "football") {
      return match.status === "halftime" ? "Halftime" : match.current_period === 1 ? "1st Half" : "2nd Half";
    }
    if (sport.slug === "basketball") {
      const ended = match.status === "halftime";
      if (match.current_period <= sport.periods.count) {
        if (ended && match.current_period === sport.periods.count && match.home_score === match.away_score) {
          return "Regulation Tied (Break)";
        }
        return ended ? `End of Q${match.current_period}` : `Quarter ${match.current_period}`;
      }
      const ot = match.current_period - sport.periods.count;
      if (ended && match.home_score === match.away_score) {
        return `${ot === 1 ? "OT" : `OT${ot}`} Tied (Break)`;
      }
      return ended ? `End of ${ot === 1 ? "OT" : `OT${ot}`}` : (ot === 1 ? "Overtime" : `OT${ot}`);
    }
    return `Set ${match.current_period}`;
  };


  const periodScores =
    (sport?.slug === "basketball" || sport?.slug === "volleyball") && events.length > 0
      ? computePeriodScores({
          events,
          scoringRules: sport.scoring_rules,
          homeTeamId: match.home_team_id,
          awayTeamId: match.away_team_id,
          periodCount: sport.periods.count,
          sportSlug: sport.slug,
        })
      : [];

  const currentPeriodScore = periodScores.find((p) => p.period === match.current_period);

  return (
    <div className="space-y-4">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-500 transition-colors">
        <ChevronLeft className="h-4 w-4" /> All matches
      </Link>

      {/* Score card */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-5 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 mb-3">
          <SportIcon slug={sport?.slug} className="h-3.5 w-3.5" /> {match.season?.name}
          {match.matchday ? ` · Matchday ${match.matchday}` : ""}
          {match.venue ? ` · ${match.venue}` : ""}
        </div>

        {/* Status */}
        <div className="mb-3">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600 dark:text-red-500">
              <Radio className="h-4 w-4 animate-pulse" />
              LIVE
              {match.current_period > 0 && <span className="font-normal text-zinc-500">· {periodLabel()}</span>}
            </span>
          ) : (
            <span className="text-sm text-zinc-400">{getStatusLabel(match.status)}</span>
          )}
        </div>

        {/* Teams & score */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-right">
            <div className="font-bold text-lg text-zinc-900 dark:text-white">{match.home_team?.name}</div>
            <div className="text-xs text-zinc-400">{match.home_team?.short_name}</div>
          </div>
          <div className="shrink-0 text-center">
            {isLive || match.status === "finished" ? (
              <>
                <div className={`text-5xl font-black tracking-tight tabular-nums ${isLive ? "text-red-600 dark:text-red-500" : "text-zinc-900 dark:text-white"}`}>
                  {match.home_score}<span className="text-zinc-300 dark:text-zinc-600 mx-1">–</span>{match.away_score}
                </div>
                {sport?.slug === "volleyball" && (
                  <div className="text-xs text-zinc-400 uppercase tracking-wider mt-0.5">Sets</div>
                )}
                {sport?.slug === "volleyball" && isLive && currentPeriodScore && (
                  <div className="text-sm text-zinc-500 mt-1">
                    Set {match.current_period}:{" "}
                    <span className="font-bold text-zinc-700 dark:text-zinc-200">
                      {currentPeriodScore.home}–{currentPeriodScore.away}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-zinc-500">
                {formatMatchDate(match.scheduled_at)}<br />
                {formatMatchTime(match.scheduled_at)}
              </div>
            )}
          </div>
          <div className="flex-1 text-left">
            <div className="font-bold text-lg text-zinc-900 dark:text-white">{match.away_team?.name}</div>
            <div className="text-xs text-zinc-400">{match.away_team?.short_name}</div>
          </div>
        </div>

        {periodScores.length > 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-xs font-semibold text-zinc-400 uppercase mb-2">
              {sport?.slug === "volleyball" ? "By Set" : "By Quarter"}
            </p>
            <div className="flex justify-center gap-2 flex-wrap">
              {periodScores.map((q) => (
                <div key={q.period} className="bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-1.5 text-sm">
                  <span className="text-xs font-bold text-zinc-400">{q.label}</span>
                  <span className="ml-2 font-semibold tabular-nums text-zinc-700 dark:text-zinc-200">{q.home}–{q.away}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Play-by-play */}
      {events.length > 0 && (
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-3">Play-by-Play</h2>
          {sport ? (
            <div className="space-y-1">
              {events.map((event) => (
                <PublicEventRow key={event.id} event={event} sport={sport} />
              ))}
            </div>
          ) : (
            <p className="text-zinc-400 text-sm">No events yet</p>
          )}
        </div>
      )}

      {events.length === 0 && isLive && (
        <div className="text-center py-8 text-zinc-400 text-sm">
          <Clock className="h-7 w-7 mx-auto mb-2 animate-pulse text-red-600 dark:text-red-500" />
          Match in progress — events will appear here live
        </div>
      )}
    </div>
  );
}

function PublicEventRow({ event, sport }: { event: MatchEvent; sport: Sport }) {
  const config = sport.event_types.find((e) => e.type === event.event_type);
  const isSystem = ["half_start","half_end","match_end","quarter_start","quarter_end","set_start","set_end"].includes(event.event_type);

  if (isSystem) {
    return (
      <div className="text-center py-2">
        <span className="text-xs text-zinc-400 font-semibold bg-zinc-50 dark:bg-zinc-800 px-3 py-1 rounded-full">
          — {config?.label ?? event.event_type} —
        </span>
      </div>
    );
  }

  const colorMap: Record<string, string> = {
    green: "bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-400",
    yellow: "bg-yellow-50 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
    red: "bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400",
    blue: "bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400",
    gray: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300",
  };

  return (
    <div className="flex items-center gap-3 py-2 border-b border-zinc-50 dark:border-zinc-800/60 last:border-0">
      <span className={`grid place-items-center h-7 w-7 rounded-full shrink-0 ${colorMap[config?.color ?? "gray"]}`}>
        <EventIcon type={event.event_type} className="h-3.5 w-3.5" />
      </span>
      <div className="flex-1 text-sm">
        <span className="font-medium text-zinc-800 dark:text-zinc-100">{config?.label ?? event.event_type}</span>
        {event.player && <span className="text-zinc-500"> · {event.player.name}</span>}
        <span className="text-xs text-zinc-400 ml-1">({event.team?.short_name})</span>
      </div>
      {event.match_minute && (
        <span className="text-xs text-zinc-400 shrink-0">{event.match_minute}&apos;</span>
      )}
    </div>
  );
}
