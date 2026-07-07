"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SportIcon } from "@/components/ui/SportIcon";
import { formatMatchDate, formatMatchTime } from "@/lib/utils/match";
import type { Match } from "@/lib/supabase/types";

type Props = { matches: Match[] };

const STATUS_ORDER: Record<string, number> = {
  live: 0,
  halftime: 0,
  scheduled: 1,
  finished: 2,
  postponed: 3,
  cancelled: 3,
};

/** Compact period tag: Q3 / OT / 1H / HT / S2 / FT — FlashScore style. */
function periodTag(m: Match): string {
  const slug = m.season?.sport?.slug;
  if (m.status === "finished") return "FT";
  if (m.status === "postponed") return "PPD";
  if (m.status === "cancelled") return "CANC";
  if (m.status === "halftime") return slug === "volleyball" ? "SB" : "HT";
  if (m.status === "live") {
    if (slug === "basketball") return m.current_period > 4 ? `OT${m.current_period - 4 > 1 ? m.current_period - 4 : ""}` : `Q${m.current_period}`;
    if (slug === "football") return m.current_period === 1 ? "1H" : "2H";
    return `S${m.current_period}`;
  }
  return "";
}

export function LeagueFeed({ matches: initialMatches }: Props) {
  const supabase = createClient();
  const [matches, setMatches] = useState(initialMatches);

  // Server component re-renders (e.g. sport filter navigation) must win over stale client state.
  useEffect(() => setMatches(initialMatches), [initialMatches]);

  useEffect(() => {
    const ids = new Set(initialMatches.map((m) => m.id));
    const channel = supabase
      .channel("home-feed")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches" },
        (payload) => {
          if (!ids.has(payload.new.id)) return;
          setMatches((prev) =>
            prev.map((m) => (m.id === payload.new.id ? { ...m, ...payload.new } : m))
          );
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMatches]);

  const leagues = useMemo(() => {
    const groups = new Map<string, { name: string; sportSlug?: string; matches: Match[] }>();
    for (const m of matches) {
      const key = m.season?.id ?? "unknown";
      if (!groups.has(key)) {
        groups.set(key, {
          name: m.season?.name ?? "Unscheduled",
          sportSlug: m.season?.sport?.slug,
          matches: [],
        });
      }
      groups.get(key)!.matches.push(m);
    }
    const list = [...groups.values()];
    for (const g of list) {
      g.matches.sort((a, b) => {
        const so = (STATUS_ORDER[a.status] ?? 4) - (STATUS_ORDER[b.status] ?? 4);
        if (so !== 0) return so;
        // Finished: newest first; everything else: soonest first.
        const dir = a.status === "finished" ? -1 : 1;
        return dir * (new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
      });
    }
    // Leagues with live matches float to the top.
    list.sort((a, b) => {
      const aLive = a.matches.some((m) => m.status === "live" || m.status === "halftime") ? 0 : 1;
      const bLive = b.matches.some((m) => m.status === "live" || m.status === "halftime") ? 0 : 1;
      return aLive - bLive || a.name.localeCompare(b.name);
    });
    return list;
  }, [matches]);

  if (leagues.length === 0) return null;

  return (
    <div className="space-y-4">
      {leagues.map((league) => {
        const liveCount = league.matches.filter(
          (m) => m.status === "live" || m.status === "halftime"
        ).length;
        return (
          <section
            key={league.name}
            className="rounded-2xl border border-white/10 bg-zinc-900/70 backdrop-blur-xl overflow-hidden"
          >
            {/* League row header */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 bg-white/[0.03]">
              <SportIcon slug={league.sportSlug} className="h-4 w-4 text-vanguard-volt shrink-0" />
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-200 truncate">
                {league.name}
              </h2>
              {liveCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-vanguard-volt text-black text-[10px] font-black px-2 py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-black animate-pulse" />
                  {liveCount} LIVE
                </span>
              )}
              <span className="ml-auto text-[10px] font-bold text-zinc-600 tabular-nums">
                {league.matches.length}
              </span>
            </div>

            <div className="divide-y divide-white/5">
              {league.matches.map((m) => (
                <MatchStrip key={m.id} match={m} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function MatchStrip({ match }: { match: Match }) {
  const isLive = match.status === "live" || match.status === "halftime";
  const isFinished = match.status === "finished";
  const showScore = isLive || isFinished;
  const tag = periodTag(match);
  const homeWin = isFinished && match.home_score > match.away_score;
  const awayWin = isFinished && match.away_score > match.home_score;

  return (
    <Link
      href={`/match/${match.id}`}
      className={`group grid grid-cols-[52px_1fr_auto_20px] items-center gap-2 px-3 py-2 transition-colors hover:bg-white/[0.04] ${
        isLive ? "bg-vanguard-volt/[0.04]" : ""
      }`}
    >
      {/* Status column */}
      <div className="text-center">
        {isLive ? (
          <>
            <span className="block text-[11px] font-black text-vanguard-volt animate-pulse">
              {tag}
            </span>
            <span className="mx-auto mt-1 block h-1 w-4 rounded-full bg-vanguard-volt" />
          </>
        ) : isFinished ? (
          <span className="text-[11px] font-bold text-zinc-500">{tag}</span>
        ) : tag ? (
          <span className="text-[11px] font-bold text-zinc-500">{tag}</span>
        ) : (
          <div className="text-[10px] font-semibold text-zinc-500 leading-tight tabular-nums">
            {formatMatchDate(match.scheduled_at)}
            <br />
            {formatMatchTime(match.scheduled_at)}
          </div>
        )}
      </div>

      {/* Teams column */}
      <div className="min-w-0 space-y-1">
        <TeamLine
          name={match.home_team?.name ?? match.home_team?.short_name ?? "Home"}
          color={match.home_team?.primary_color}
          emphasis={isLive || homeWin}
          dim={awayWin}
        />
        <TeamLine
          name={match.away_team?.name ?? match.away_team?.short_name ?? "Away"}
          color={match.away_team?.primary_color}
          emphasis={isLive || awayWin}
          dim={homeWin}
        />
      </div>

      {/* Score column */}
      <div className="text-right tabular-nums">
        {showScore ? (
          <>
            <div
              className={`text-sm font-black leading-5 ${
                isLive ? "text-vanguard-volt" : homeWin ? "text-white" : "text-zinc-400"
              }`}
            >
              {match.home_score}
            </div>
            <div
              className={`text-sm font-black leading-5 ${
                isLive ? "text-vanguard-volt" : awayWin ? "text-white" : "text-zinc-400"
              }`}
            >
              {match.away_score}
            </div>
          </>
        ) : (
          <span className="grid place-items-center h-7 w-7 rounded-lg bg-white/5 border border-white/10 text-zinc-500 group-hover:text-vanguard-volt group-hover:border-vanguard-volt/40 transition-colors">
            <Play className="h-3 w-3" />
          </span>
        )}
      </div>

      <ChevronRight className="h-4 w-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
    </Link>
  );
}

function TeamLine({
  name,
  color,
  emphasis,
  dim,
}: {
  name: string;
  color?: string;
  emphasis?: boolean;
  dim?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span
        className="h-3 w-1 rounded-full shrink-0"
        style={{ background: color ?? "#52525b" }}
      />
      <span
        className={`truncate text-[13px] leading-5 ${
          emphasis ? "font-bold text-white" : dim ? "font-medium text-zinc-500" : "font-semibold text-zinc-300"
        }`}
      >
        {name}
      </span>
    </div>
  );
}
