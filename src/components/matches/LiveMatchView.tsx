"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Match, MatchEvent, Sport } from "@/lib/supabase/types";
import { computePeriodScores } from "@/lib/utils/periodScores";
import { EventLog } from "@/components/scorer/EventLog";
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
      <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
        ← All matches
      </Link>

      {/* Score card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
        <div className="text-xs text-gray-400 mb-3">
          {sport?.icon} {match.season?.name}
          {match.matchday ? ` · Matchday ${match.matchday}` : ""}
          {" · "}{match.venue}
        </div>

        {/* Status */}
        <div className="mb-3">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              LIVE
              {match.current_period > 0 && <span className="font-normal text-gray-500">· {periodLabel()}</span>}
            </span>
          ) : (
            <span className="text-sm text-gray-400">{getStatusLabel(match.status)}</span>
          )}
        </div>

        {/* Teams & score */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-right">
            <div className="font-bold text-lg">{match.home_team?.name}</div>
            <div className="text-xs text-gray-400">{match.home_team?.short_name}</div>
          </div>
          <div className="shrink-0 text-center">
            {isLive || match.status === "finished" ? (
              <>
                <div className={`text-5xl font-black tabular-nums ${isLive ? "text-brand-red" : "text-gray-900"}`}>
                  {match.home_score}<span className="text-gray-300 mx-1">–</span>{match.away_score}
                </div>
                {sport?.slug === "volleyball" && (
                  <div className="text-xs text-gray-400 uppercase tracking-wider mt-0.5">Sets</div>
                )}
                {sport?.slug === "volleyball" && isLive && currentPeriodScore && (
                  <div className="text-sm text-gray-500 mt-1">
                    Set {match.current_period}:{" "}
                    <span className="font-bold text-gray-700">
                      {currentPeriodScore.home}–{currentPeriodScore.away}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-500">
                {formatMatchDate(match.scheduled_at)}<br />
                {formatMatchTime(match.scheduled_at)}
              </div>
            )}
          </div>
          <div className="flex-1 text-left">
            <div className="font-bold text-lg">{match.away_team?.name}</div>
            <div className="text-xs text-gray-400">{match.away_team?.short_name}</div>
          </div>
        </div>

        {periodScores.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
              {sport?.slug === "volleyball" ? "By Set" : "By Quarter"}
            </p>
            <div className="flex justify-center gap-2 flex-wrap">
              {periodScores.map((q) => (
                <div key={q.period} className="bg-gray-50 rounded-lg px-3 py-1.5 text-sm">
                  <span className="text-xs font-bold text-gray-400">{q.label}</span>
                  <span className="ml-2 font-semibold tabular-nums">{q.home}–{q.away}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Play-by-play */}
      {events.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-3">Play-by-Play</h2>
          {sport ? (
            <div className="space-y-1">
              {events.map((event) => (
                <PublicEventRow key={event.id} event={event} sport={sport} />
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No events yet</p>
          )}
        </div>
      )}

      {events.length === 0 && isLive && (
        <div className="text-center py-8 text-gray-400 text-sm">
          <div className="animate-pulse text-2xl mb-2">⏱️</div>
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
        <span className="text-xs text-gray-400 font-semibold bg-gray-50 px-3 py-1 rounded-full">
          — {config?.label ?? event.event_type} —
        </span>
      </div>
    );
  }

  const colorMap: Record<string, string> = {
    green: "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700",
    gray: "bg-gray-50 text-gray-600",
  };

  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${colorMap[config?.color ?? "gray"]}`}>
        {config?.icon}
      </span>
      <div className="flex-1 text-sm">
        <span className="font-medium">{config?.label ?? event.event_type}</span>
        {event.player && <span className="text-gray-500"> · {event.player.name}</span>}
        <span className="text-xs text-gray-400 ml-1">({event.team?.short_name})</span>
      </div>
      {event.match_minute && (
        <span className="text-xs text-gray-400 shrink-0">{event.match_minute}&apos;</span>
      )}
    </div>
  );
}
