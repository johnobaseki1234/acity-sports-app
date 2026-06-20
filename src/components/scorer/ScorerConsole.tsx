"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Play, Pause, Square, Undo2, Zap, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Match, Player, Sport, EventTypeConfig, MatchEvent } from "@/lib/supabase/types";
import { computePeriodScores } from "@/lib/utils/periodScores";
import { SportIcon } from "@/components/ui/SportIcon";
import { EventIcon } from "@/components/ui/EventIcon";
import { EventLog } from "./EventLog";
import { PlayerPicker } from "./PlayerPicker";

type Props = {
  match: Match;
  sport: Sport;
  homePlayers: Player[];
  awayPlayers: Player[];
};

type PendingEvent = {
  eventType: EventTypeConfig;
  teamId: string;
  side: "home" | "away";
  isMissed?: boolean;
};

export function ScorerConsole({ match: initialMatch, sport, homePlayers, awayPlayers }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [match, setMatch] = useState(initialMatch);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [pending, setPending] = useState<PendingEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [minuteInput, setMinuteInput] = useState("");
  
  // Basketball 2-Stage Scoring UI States
  const [basketballIntent, setBasketballIntent] = useState<{
    eventType: EventTypeConfig;
    teamId: string;
    side: "home" | "away";
  } | null>(null);

  // Safe configurations with robust fallbacks to resolve any missing properties/types
  const sportPeriodsCount = (sport?.periods as any)?.count ?? 4;
  const sportPeriodsName = (sport?.periods as any)?.name ?? "period";
  const sportEventTypes = (sport?.event_types as EventTypeConfig[]) ?? [];
  const sportScoringRules = (sport as any)?.scoring_rules ?? {};

  const isLive = match.status === "live" || match.status === "halftime";
  const isVolleyball = sport.slug === "volleyball";
  const isBasketball = sport.slug === "basketball";
  const isBasketballTiedAtEnd =
    sport.slug === "basketball" &&
    match.status === "halftime" &&
    (match.current_period ?? 0) >= sportPeriodsCount &&
    match.home_score === match.away_score;

  useEffect(() => {
    supabase
      .from("match_events")
      .select("*, player:players!match_events_player_id_fkey(*), team:teams(*)")
      .eq("match_id", match.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setEvents((data ?? []) as MatchEvent[]));
  }, [match.id, supabase]);

  useEffect(() => {
    const channel = supabase
      .channel(`scorer-${match.id}`)
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
      .on("postgres_changes", {
        event: "DELETE", schema: "public", table: "match_events",
      }, (payload) => {
        setEvents((prev) => prev.filter((e) => e.id !== payload.old.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [match.id, supabase]);

  const getPeriodStartEventType = useCallback(() => {
    if (sport.slug === "basketball") return "quarter_start";
    if (sport.slug === "volleyball") return "set_start";
    return "half_start";
  }, [sport.slug]);

  const getPeriodEndEventType = useCallback(() => {
    if (sport.slug === "basketball") return "quarter_end";
    if (sport.slug === "volleyball") return "set_end";
    return "half_end";
  }, [sport.slug]);

  async function logSystemEvent(eventType: string) {
    await supabase.from("match_events").insert({
      match_id: match.id,
      event_type: eventType,
      team_id: match.home_team_id,
      period: match.current_period || 1,
    });
  }

  async function startMatch() {
    setSaving(true);
    await supabase.from("matches").update({
      status: "live",
      current_period: 1,
      started_at: new Date().toISOString(),
      clock_running: true,
    }).eq("id", match.id);
    await logSystemEvent(getPeriodStartEventType());
    setSaving(false);
  }

  // Safely compute modern period data structures
  const periodScores =
    (sport.slug === "basketball" || sport.slug === "volleyball") && events.length > 0
      ? computePeriodScores({
          events,
          scoringRules: sportScoringRules,
          homeTeamId: match.home_team_id,
          awayTeamId: match.away_team_id,
          periodCount: sportPeriodsCount,
          sportSlug: sport.slug,
        })
      : [];

  const currentPeriodScore = periodScores.find((p) => p.period === match.current_period);

  async function endPeriod() {
    if (isVolleyball) {
      const setHome = currentPeriodScore?.home ?? 0;
      const setAway = currentPeriodScore?.away ?? 0;
      const homeWon = setHome > setAway;
      const awayWon = setAway > setHome;
      const prevHomeSets = (match.home_sets ?? []) as number[];
      const prevAwaySets = (match.away_sets ?? []) as number[];
      const newHomeSets = [...prevHomeSets, setHome];
      const newAwaySets = [...prevAwaySets, setAway];
      const newHomeSetsWon = (match.home_score ?? 0) + (homeWon ? 1 : 0);
      const newAwaySetsWon = (match.away_score ?? 0) + (awayWon ? 1 : 0);
      const matchOver =
        newHomeSetsWon >= 3 || newAwaySetsWon >= 3 || (match.current_period ?? 0) >= sportPeriodsCount;

      if (matchOver) {
        const winner = newHomeSetsWon >= newAwaySetsWon ? match.home_team?.name : match.away_team?.name;
        if (!confirm(`End match? ${winner} wins ${newHomeSetsWon}–${newAwaySetsWon} sets.`)) return;
        setSaving(true);
        await supabase.from("matches").update({
          status: "finished",
          clock_running: false,
          finished_at: new Date().toISOString(),
          home_score: newHomeSetsWon,
          away_score: newAwaySetsWon,
          home_sets: newHomeSets,
          away_sets: newAwaySets,
        }).eq("id", match.id);
        await logSystemEvent("match_end");
        setSaving(false);
        router.push("/admin");
        return;
      }

      setSaving(true);
      await supabase.from("matches").update({
        status: "halftime",
        clock_running: false,
        home_score: newHomeSetsWon,
        away_score: newAwaySetsWon,
        home_sets: newHomeSets,
        away_sets: newAwaySets,
      }).eq("id", match.id);
      await logSystemEvent("set_end");
      setSaving(false);
      return;
    }

    const isTied = match.home_score === match.away_score;
    const isLastScheduledPeriod = (match.current_period ?? 0) >= sportPeriodsCount;
    const canEndMatch =
      isLastScheduledPeriod &&
      (sport.slug === "football" || (sport.slug === "basketball" && !isTied));

    if (canEndMatch) {
      if (!confirm("End the match? This will finalize the score.")) return;
      setSaving(true);
      await supabase.from("matches").update({
        status: "finished",
        clock_running: false,
        finished_at: new Date().toISOString(),
      }).eq("id", match.id);
      await logSystemEvent("match_end");
      setSaving(false);
      router.push("/admin");
      return;
    }
    setSaving(true);
    await supabase.from("matches").update({
      status: "halftime",
      clock_running: false,
    }).eq("id", match.id);
    await logSystemEvent(getPeriodEndEventType());
    setSaving(false);
  }

  async function startNextPeriod() {
    setSaving(true);
    await supabase.from("matches").update({
      status: "live",
      current_period: (match.current_period ?? 1) + 1,
      clock_running: true,
    }).eq("id", match.id);
    await logSystemEvent(getPeriodStartEventType());
    setSaving(false);
  }

  function handleEventButton(eventType: EventTypeConfig, teamId: string, side: "home" | "away") {
    if (isBasketball && (eventType.type === "2_pointer" || eventType.type === "3_pointer" || eventType.type === "free_throw")) {
      setBasketballIntent({ eventType, teamId, side });
      return;
    }

    if (eventType.requires_player) {
      setPending({ eventType, teamId, side });
    } else {
      logEvent(eventType, teamId, null);
    }
  }

  function handleBasketballOutcome(made: boolean) {
    if (!basketballIntent) return;
    
    const configuredType = { ...basketballIntent.eventType };
    if (!made) {
      configuredType.type = `missed_${configuredType.type}`;
      configuredType.label = `Missed ${configuredType.label}`;
      configuredType.affects_score = false; 
    }

    if (configuredType.requires_player) {
      setPending({ 
        eventType: configuredType, 
        teamId: basketballIntent.teamId, 
        side: basketballIntent.side,
        isMissed: !made
      });
    } else {
      logEvent(configuredType, basketballIntent.teamId, null);
    }
    setBasketballIntent(null);
  }

  async function logEvent(eventType: EventTypeConfig, teamId: string, player: Player | null) {
    setSaving(true);
    setPending(null);
    
    await supabase.from("match_events").insert({
      match_id: match.id,
      event_type: eventType.type,
      team_id: teamId,
      player_id: player?.id || null,
      period: match.current_period || 1,
      match_minute: minuteInput ? parseInt(minuteInput) : null,
      details: eventType.type.startsWith("missed_") ? { missed: true } : null
    });
    
    setMinuteInput("");
    setSaving(false);
  }

  async function undoLast() {
    const last = events[0];
    if (!last) return;
    if (!confirm("Remove last event?")) return;
    await supabase.from("match_events").delete().eq("id", last.id);
  }

  const periodLabel = useCallback(() => {
    if (sport.slug === "football") return match.current_period === 1 ? "1st Half" : "2nd Half";
    if (sport.slug === "basketball") {
      if ((match.current_period ?? 1) <= sportPeriodsCount) return `Q${match.current_period}`;
      const ot = (match.current_period ?? 1) - sportPeriodsCount;
      return ot === 1 ? "OT" : `OT${ot}`;
    }
    return `Set ${match.current_period}`;
  }, [sport.slug, sportPeriodsCount, match.current_period]);

  const nextPeriodLabel = (() => {
    const next = (match.current_period ?? 1) + 1;
    if (sport.slug === "football") return next === 1 ? "1st Half" : "2nd Half";
    if (sport.slug === "basketball") {
      if (next <= sportPeriodsCount) return `Q${next}`;
      const ot = next - sportPeriodsCount;
      return ot === 1 ? "OT" : `OT${ot}`;
    }
    return `Set ${next}`;
  })();

  const scoreEventTypes = sportEventTypes.filter((e) => e.affects_score);
  const systemEventTypes = ["half_start","half_end","match_end","quarter_start","quarter_end","set_start","set_end"];
  const otherEventTypes = sportEventTypes.filter((e) => !e.affects_score && !systemEventTypes.includes(e.type) && !e.type.startsWith("missed_"));

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.push("/admin")} className="inline-flex items-center gap-1 text-gray-400 hover:text-white text-sm">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 font-medium">
          <SportIcon slug={sport.slug} className="h-3.5 w-3.5" /> {sport.name} · {match.season?.name}
        </span>
        <span className="text-xs text-gray-400">{match.venue}</span>
      </div>

      {/* Scoreboard */}
      <div className="bg-gray-800 px-4 pb-4 text-center">
        <div className="flex items-center justify-center gap-4 mt-2">
          <div className="flex-1 text-right">
            <div className="font-bold text-white text-base leading-tight">{match.home_team?.name}</div>
            <div className="text-xs text-gray-400">{match.home_team?.short_name}</div>
          </div>
          <div className="shrink-0">
            <div className="text-4xl font-black text-white tabular-nums">
              {match.home_score} <span className="text-gray-500">–</span> {match.away_score}
            </div>
            {isVolleyball && (
              <div className="text-xs text-gray-500 text-center uppercase tracking-wider">Sets</div>
            )}
            {isVolleyball && match.status === "live" && currentPeriodScore && (
              <div className="text-xs text-gray-400 text-center mt-0.5">
                Set {match.current_period}:{" "}
                <span className="text-white font-semibold">
                  {currentPeriodScore.home}–{currentPeriodScore.away}
                </span>
              </div>
            )}
            <div className="text-xs text-center mt-1">
              {match.status === "live" && (
                <span className="text-red-400 font-bold flex items-center justify-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block" />
                  LIVE · {periodLabel()}
                </span>
              )}
              {match.status === "halftime" && <span className="text-yellow-400 font-bold">{sportPeriodsName.toUpperCase()} BREAK</span>}
              {match.status === "scheduled" && <span className="text-gray-400">NOT STARTED</span>}
            </div>
          </div>
          <div className="flex-1 text-left">
            <div className="font-bold text-white text-base leading-tight">{match.away_team?.name}</div>
            <div className="text-xs text-gray-400">{match.away_team?.short_name}</div>
          </div>
        </div>

        {periodScores.length > 0 && (
          <div className="flex justify-center gap-2 mt-3 flex-wrap">
            {periodScores.map((q) => (
              <div key={q.period} className="bg-gray-700 rounded-lg px-2.5 py-1 text-xs text-gray-300">
                <span className="font-bold text-gray-400">{q.label}</span>{" "}
                {q.home}–{q.away}
              </div>
            ))}
          </div>
        )}

        {/* Game controls */}
        <div className="flex justify-center gap-3 mt-4">
          {match.status === "scheduled" && (
            <button onClick={startMatch} disabled={saving} className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2.5 rounded-xl disabled:opacity-50">
              <Play className="h-4 w-4" /> Start Match
            </button>
          )}
          {match.status === "live" && (
            <>
              {(() => {
                const isEndMatch =
                  !isVolleyball &&
                  (match.current_period ?? 0) >= sportPeriodsCount &&
                  !(sport.slug === "basketball" && match.home_score === match.away_score);
                return (
                  <button onClick={endPeriod} disabled={saving} className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2.5 rounded-xl disabled:opacity-50 text-sm">
                    {isEndMatch ? <Square className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    {isVolleyball ? "End Set" : isEndMatch ? "End Match" : "End Period"}
                  </button>
                );
              })()}
              {events.length > 0 && (
                <button onClick={undoLast} disabled={saving} className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2.5 rounded-xl text-sm">
                  <Undo2 className="h-4 w-4" /> Undo
                </button>
              )}
            </>
          )}
          {match.status === "halftime" && (
            isBasketballTiedAtEnd ? (
              <button onClick={startNextPeriod} disabled={saving} className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold px-6 py-2.5 rounded-xl disabled:opacity-50 animate-pulse">
                <Play className="h-4 w-4" /> Start {nextPeriodLabel} (Tied)
              </button>
            ) : (
              <button onClick={startNextPeriod} disabled={saving} className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2.5 rounded-xl disabled:opacity-50">
                <Play className="h-4 w-4" /> Start {nextPeriodLabel}
              </button>
            )
          )}
        </div>
      </div>

      {/* Event buttons — only shown when live */}
      {match.status === "live" && (
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {/* Optional minute input */}
          {sport.slug === "football" && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Minute:</span>
              <input
                type="number"
                value={minuteInput}
                onChange={(e) => setMinuteInput(e.target.value)}
                placeholder="e.g. 34"
                min={1} max={120}
                className="w-20 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-white text-sm text-center"
              />
            </div>
          )}

          {/* Basketball Stage-2 Action Resolution Drawer Overlay */}
          {basketballIntent && (
            <div className="bg-gray-800 border-2 border-red-500/50 rounded-2xl p-4 text-center animate-in fade-in zoom-in-95 duration-150">
              <p className="text-sm text-gray-300 font-semibold uppercase tracking-wider mb-3">
                Resolve Shot: {basketballIntent.eventType.label} ({basketballIntent.side === "home" ? match.home_team?.short_name : match.away_team?.short_name})
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleBasketballOutcome(true)}
                  className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-xl inline-flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                >
                  <Check className="h-5 w-5" /> MADE
                </button>
                <button
                  onClick={() => handleBasketballOutcome(false)}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-xl inline-flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                >
                  <X className="h-5 w-5" /> MISSED
                </button>
              </div>
              <button 
                onClick={() => setBasketballIntent(null)}
                className="text-xs text-gray-500 hover:text-gray-300 underline mt-3 block mx-auto"
              >
                Cancel Action
              </button>
            </div>
          )}

          {/* Scoring events */}
          {scoreEventTypes.length > 0 && !basketballIntent && (
            <Section label="Scoring">
              <TeamButtons
                eventTypes={scoreEventTypes}
                homeTeam={match.home_team!}
                awayTeam={match.away_team!}
                onEvent={handleEventButton}
                saving={saving}
              />
            </Section>
          )}

          {/* Other events */}
          {otherEventTypes.length > 0 && !basketballIntent && (
            <Section label="Events">
              <TeamButtons
                eventTypes={otherEventTypes}
                homeTeam={match.home_team!}
                awayTeam={match.away_team!}
                onEvent={handleEventButton}
                saving={saving}
              />
            </Section>
          )}

          {/* Event log */}
          <Section label="Event Log">
            <EventLog events={events} sport={sport} />
          </Section>
        </div>
      )}

      {/* Halftime — show event log */}
      {match.status === "halftime" && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {isBasketballTiedAtEnd && (
            <div className="bg-yellow-950/40 border border-yellow-500/50 rounded-2xl p-5 max-w-md mx-auto text-center backdrop-blur-md">
              <div className="text-yellow-400 font-bold text-lg mb-2 flex items-center justify-center gap-2">
                <Zap className="h-5 w-5" /> OVERTIME REQUIRED <Zap className="h-5 w-5" />
              </div>
              <p className="text-gray-300 text-sm mb-4 font-medium">
                {match.current_period === 4 ? "Regulation" : `OT${(match.current_period ?? 4) - 4}`} ended in a tie ({match.home_score} – {match.away_score}).
                Start the next overtime period to determine a winner!
              </p>
              <button
                onClick={startNextPeriod}
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-gray-950 font-black py-3 rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50"
              >
                <Play className="h-4 w-4" /> Start {nextPeriodLabel}
              </button>
            </div>
          )}
          <Section label={`${periodLabel()} Events`}>
            <EventLog events={events} sport={sport} />
          </Section>
        </div>
      )}

      {/* Player picker modal */}
      {pending && (
        <PlayerPicker
          players={pending!.side === "home" ? homePlayers : awayPlayers}
          teamName={pending!.side === "home" ? (match.home_team?.name ?? "") : (match.away_team?.name ?? "")}
          eventLabel={pending!.eventType.label}
          onSelect={(player) => logEvent(pending!.eventType, pending!.teamId, player)}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{label}</p>
      {children}
    </div>
  );
}

type TeamButtonsProps = {
  eventTypes: EventTypeConfig[];
  homeTeam: { id: string; name: string; short_name: string };
  awayTeam: { id: string; name: string; short_name: string };
  onEvent: (et: EventTypeConfig, teamId: string, side: "home" | "away") => void;
  saving: boolean;
};

function TeamButtons({ eventTypes, homeTeam, awayTeam, onEvent, saving }: TeamButtonsProps) {
  const colorMap: Record<string, string> = {
    green: "bg-green-700 hover:bg-green-600 active:bg-green-500",
    yellow: "bg-yellow-600 hover:bg-yellow-500 active:bg-yellow-400",
    red: "bg-red-700 hover:bg-red-600 active:bg-red-500",
    blue: "bg-blue-700 hover:bg-blue-600 active:bg-blue-500",
    gray: "bg-gray-600 hover:bg-gray-500 active:bg-gray-400",
  };

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
      {eventTypes.map((et) => (
        <div key={et.type} className="contents">
          {/* Home side */}
          <button
            onClick={() => onEvent(et, homeTeam.id, "home")}
            disabled={saving}
            className={`${colorMap[et.color] ?? colorMap.gray} text-white rounded-xl px-3 py-3 text-sm font-medium text-left disabled:opacity-40 transition-colors`}
          >
            <EventIcon type={et.type} className="h-4 w-4 mb-1" />
            <span className="text-xs text-gray-200 block">{homeTeam.short_name}</span>
            <span className="font-semibold">{et.label}</span>
          </button>
          {/* Away side */}
          <button
            onClick={() => onEvent(et, awayTeam.id, "away")}
            disabled={saving}
            className={`${colorMap[et.color] ?? colorMap.gray} text-white rounded-xl px-3 py-3 text-sm font-medium text-left disabled:opacity-40 transition-colors`}
          >
            <EventIcon type={et.type} className="h-4 w-4 mb-1" />
            <span className="text-xs text-gray-200 block">{awayTeam.short_name}</span>
            <span className="font-semibold">{et.label}</span>
          </button>
        </div>
      ))}
    </div>
  );
}