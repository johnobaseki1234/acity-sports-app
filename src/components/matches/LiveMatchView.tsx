"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Radio, Clock, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Match, MatchEvent, Player, Sport } from "@/lib/supabase/types";
import { computePeriodScores } from "@/lib/utils/periodScores";
import { SportIcon } from "@/components/ui/SportIcon";
import { EventIcon } from "@/components/ui/EventIcon";
import { PlayerDrawer } from "@/components/matches/PlayerDrawer";
import { BoxScore } from "@/components/matches/BoxScore";
import { formatMatchDate, formatMatchTime, getStatusLabel } from "@/lib/utils/match";
import Link from "next/link";

type Props = { match: Match; initialEvents: MatchEvent[]; sport: Sport; roster?: Player[] };

type Tab = "feed" | "box";

const PERIOD_START_TYPES = ["half_start", "quarter_start", "set_start"];

export function LiveMatchView({ match: initialMatch, initialEvents, sport, roster = [] }: Props) {
  const supabase = createClient();
  const [match, setMatch] = useState(initialMatch);
  const [events, setEvents] = useState<MatchEvent[]>(initialEvents);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [tab, setTab] = useState<Tab>("feed");

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

  // Clock anchor: the newest period-start system event (events are newest-first).
  const lastPeriodStart = events.find((e) => PERIOD_START_TYPES.includes(e.event_type));
  const clockRunning = match.status === "live" && match.clock_running !== false;

  const homeRoster = roster.filter((p) => p.team_id === match.home_team_id);
  const awayRoster = roster.filter((p) => p.team_id === match.away_team_id);
  const selectedTeam =
    selectedPlayer?.team_id === match.home_team_id ? match.home_team
    : selectedPlayer?.team_id === match.away_team_id ? match.away_team
    : undefined;

  return (
    <div className="space-y-4">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-vanguard-volt dark:hover:text-vanguard-volt transition-colors">
        <ChevronLeft className="h-4 w-4" /> All matches
      </Link>

      {/* ESPN-style fixed score strip + segmented tabs */}
      <div className="sticky top-16 z-30">
        <div className="rounded-3xl shadow-lg border border-white/10 bg-vanguard-charcoal text-white relative overflow-hidden">
          {/* Ambient glow */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 -left-16 h-56 w-56 rounded-full bg-vanguard-volt/[0.07] blur-3xl" />
            <div className="absolute -bottom-24 -right-16 h-56 w-56 rounded-full bg-vanguard-crimson/[0.08] blur-3xl" />
          </div>

          <div className="relative px-5 pt-4">
            <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400 mb-2">
              <SportIcon slug={sport?.slug} className="h-3.5 w-3.5" /> {match.season?.name}
              {match.matchday ? ` · Matchday ${match.matchday}` : ""}
              {match.venue ? ` · ${match.venue}` : ""}
            </div>

            {/* Status + clock */}
            <div className="mb-2 flex items-center justify-center gap-3">
              {isLive ? (
                <>
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-vanguard-volt">
                    <Radio className="h-4 w-4 animate-pulse" />
                    LIVE
                    {match.current_period > 0 && <span className="font-normal text-zinc-400">· {periodLabel()}</span>}
                  </span>
                  <LiveClock
                    startIso={lastPeriodStart?.created_at ?? match.started_at}
                    running={clockRunning}
                  />
                </>
              ) : (
                <span className="text-sm text-zinc-400">{getStatusLabel(match.status)}</span>
              )}
            </div>

            {/* Teams & score */}
            <div className="flex items-center justify-between gap-4 pb-3">
              <div className="flex-1 text-right">
                <div className="font-bold text-base sm:text-lg text-white">{match.home_team?.name}</div>
                <div className="text-xs text-zinc-500">{match.home_team?.short_name}</div>
              </div>
              <div className="shrink-0 text-center">
                {isLive || match.status === "finished" ? (
                  <>
                    <div className={`text-4xl sm:text-5xl font-black tracking-tight tabular-nums ${isLive ? "text-vanguard-volt" : "text-white"}`}>
                      {match.home_score}<span className="text-zinc-600 mx-1">–</span>{match.away_score}
                    </div>
                    {sport?.slug === "volleyball" && (
                      <div className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5">Sets</div>
                    )}
                    {sport?.slug === "volleyball" && isLive && currentPeriodScore && (
                      <div className="text-sm text-zinc-400 mt-1">
                        Set {match.current_period}:{" "}
                        <span className="font-bold text-zinc-200">
                          {currentPeriodScore.home}–{currentPeriodScore.away}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-zinc-400">
                    {formatMatchDate(match.scheduled_at)}<br />
                    {formatMatchTime(match.scheduled_at)}
                  </div>
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-base sm:text-lg text-white">{match.away_team?.name}</div>
                <div className="text-xs text-zinc-500">{match.away_team?.short_name}</div>
              </div>
            </div>
          </div>

          {/* SofaScore-style segmented tabs */}
          <div className="relative grid grid-cols-2 border-t border-white/10">
            <TabButton label="Match Feed" active={tab === "feed"} onClick={() => setTab("feed")} />
            <TabButton label="Box Score" active={tab === "box"} onClick={() => setTab("box")} />
          </div>
        </div>
      </div>

      {tab === "feed" ? (
        <>
          {periodScores.length > 0 && (
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-4">
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

          {/* Play-by-play */}
          {events.length > 0 && (
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-4">
              <h2 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase mb-3">Match Feed</h2>
              <div className="space-y-1">
                {events.map((event) => (
                  <PublicEventRow
                    key={event.id}
                    event={event}
                    sport={sport}
                    onSelectPlayer={setSelectedPlayer}
                  />
                ))}
              </div>
            </div>
          )}

          {events.length === 0 && isLive && (
            <div className="text-center py-8 text-zinc-400 text-sm">
              <Clock className="h-7 w-7 mx-auto mb-2 animate-pulse text-vanguard-volt dark:text-vanguard-volt" />
              Match in progress — events will appear here live
            </div>
          )}
        </>
      ) : (
        <BoxScore
          homeTeam={match.home_team}
          awayTeam={match.away_team}
          homeRoster={homeRoster}
          awayRoster={awayRoster}
          events={events}
          sport={sport}
          onSelectPlayer={setSelectedPlayer}
        />
      )}

      <PlayerDrawer
        player={selectedPlayer}
        team={selectedTeam}
        events={events}
        sport={sport}
        onClose={() => setSelectedPlayer(null)}
      />
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-selected={active}
      role="tab"
      className={`relative py-3 text-sm font-bold uppercase tracking-wide transition-colors ${
        active ? "text-vanguard-volt" : "text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {label}
      {active && (
        <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full bg-vanguard-volt" />
      )}
    </button>
  );
}

function LiveClock({ startIso, running }: { startIso: string | null; running: boolean }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  if (!startIso || !running) return null;

  const elapsed = Math.max(0, Math.floor((now - new Date(startIso).getTime()) / 1000));
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 px-2 py-0.5 text-sm font-bold tabular-nums text-vanguard-volt">
      <Clock className="h-3.5 w-3.5" />
      {mm}:{ss}
    </span>
  );
}

function PublicEventRow({
  event,
  sport,
  onSelectPlayer,
}: {
  event: MatchEvent;
  sport: Sport;
  onSelectPlayer: (p: Player) => void;
}) {
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

  // Key moments (scores, red cards) carry a media slot ready for game-film reels.
  const isKeyMoment =
    (config?.affects_score && (config.score_value ?? 0) > 0) || event.event_type === "red_card";

  return (
    <div className="flex items-center gap-3 py-2 border-b border-zinc-50 dark:border-zinc-800/60 last:border-0">
      <span className={`grid place-items-center h-7 w-7 rounded-full shrink-0 ${colorMap[config?.color ?? "gray"]}`}>
        <EventIcon type={event.event_type} className="h-3.5 w-3.5" />
      </span>
      <div className="flex-1 min-w-0 text-sm">
        <span className="font-medium text-zinc-800 dark:text-zinc-100">{config?.label ?? event.event_type}</span>
        {event.player && (
          <>
            {" · "}
            <button
              onClick={() => onSelectPlayer(event.player!)}
              className="text-zinc-500 hover:text-vanguard-volt dark:hover:text-vanguard-volt font-medium underline-offset-2 hover:underline transition-colors"
            >
              {event.player.name}
            </button>
          </>
        )}
        <span className="text-xs text-zinc-400 ml-1">({event.team?.short_name})</span>
      </div>
      {event.match_minute && (
        <span className="text-xs text-zinc-400 shrink-0">{event.match_minute}&apos;</span>
      )}
      {isKeyMoment && <MediaReelSlot />}
    </div>
  );
}

/** Aspect-locked placeholder for future Hudl-style highlight reels on key moments. */
function MediaReelSlot() {
  return (
    <div
      aria-label="Highlight reel coming soon"
      className="shrink-0 w-[72px] aspect-video rounded-lg border border-white/10 bg-white/[0.04] grid place-items-center relative overflow-hidden"
    >
      <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-vanguard-volt/[0.06] to-transparent" />
      <div className="relative flex flex-col items-center gap-0.5">
        <Play className="h-3.5 w-3.5 text-vanguard-volt" fill="currentColor" />
        <span className="text-[7px] font-black uppercase tracking-widest text-zinc-500">Reel</span>
      </div>
    </div>
  );
}
