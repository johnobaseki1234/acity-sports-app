"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { useToast } from "../../contexts/ToastContext";
import {
  formatEventToast,
  formatWhatsAppMessage,
  NotificationPayload,
} from "../../lib/notifications/formatter";

type LiveMatch = {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_name: string;
  home_short: string;
  away_name: string;
  away_short: string;
  home_score: number;
  away_score: number;
  status: string;
  current_period: number;
  sport_slug: string;
  sport_icon: string;
  season_name: string;
};

// Supabase returns nested to-one relations as an object, but the typings
// sometimes widen to an array — normalize to the first element.
function one<T>(value: T | T[] | null | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : value ?? undefined;
}

const LIVE_SELECT = `
  id, home_team_id, away_team_id, home_score, away_score, status, current_period,
  home_team:teams!matches_home_team_id_fkey(name, short_name),
  away_team:teams!matches_away_team_id_fkey(name, short_name),
  season:seasons(name, sport:sports(slug, icon))
`;

export function LiveTicker() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/scorer");

  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const { showToast } = useToast();

  const mapRow = useCallback((row: Record<string, unknown>): LiveMatch => {
    const home = one(row.home_team as { name: string; short_name: string }[]);
    const away = one(row.away_team as { name: string; short_name: string }[]);
    const season = one(row.season as { name: string; sport: unknown }[]);
    const sport = one(season?.sport as { slug: string; icon: string }[]);
    return {
      id: row.id as string,
      home_team_id: row.home_team_id as string,
      away_team_id: row.away_team_id as string,
      home_name: home?.name ?? "Home",
      home_short: home?.short_name ?? "HOM",
      away_name: away?.name ?? "Away",
      away_short: away?.short_name ?? "AWY",
      home_score: (row.home_score as number) ?? 0,
      away_score: (row.away_score as number) ?? 0,
      status: row.status as string,
      current_period: (row.current_period as number) ?? 0,
      sport_slug: sport?.slug ?? "",
      sport_icon: sport?.icon ?? "🏆",
      season_name: season?.name ?? "",
    };
  }, []);

  useEffect(() => {
    if (isAdmin) return;
    const supabase = createClient();
    let cancelled = false;

    async function loadLive() {
      const { data } = await supabase
        .from("matches")
        .select(LIVE_SELECT)
        .in("status", ["live", "halftime"])
        .order("scheduled_at", { ascending: true });
      if (cancelled) return;
      setMatches((data ?? []).map((r) => mapRow(r as Record<string, unknown>)));
    }

    loadLive();

    const channel = supabase
      .channel("global-live-ticker")
      // Score / status changes
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches" },
        (payload) => {
          const updated = payload.new as Record<string, unknown>;
          const id = updated.id as string;
          const status = updated.status as string;
          const stillLive = status === "live" || status === "halftime";

          setMatches((prev) => {
            const known = prev.some((m) => m.id === id);
            if (!stillLive) return prev.filter((m) => m.id !== id);
            if (!known) {
              // A match just went live and we don't have its team names — refetch.
              loadLive();
              return prev;
            }
            return prev.map((m) =>
              m.id === id
                ? {
                    ...m,
                    home_score: (updated.home_score as number) ?? m.home_score,
                    away_score: (updated.away_score as number) ?? m.away_score,
                    status,
                    current_period: (updated.current_period as number) ?? m.current_period,
                  }
                : m
            );
          });
        }
      )
      // New events → fire a toast for noteworthy ones
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "match_events" },
        async (payload) => {
          const ev = payload.new as {
            id: string;
            match_id: string;
            team_id: string;
            event_type: string;
            period: number;
          };
          // Resolve current match context from our live set.
          let match: LiveMatch | undefined;
          setMatches((prev) => {
            match = prev.find((m) => m.id === ev.match_id);
            return prev;
          });
          if (!match) return;

          // Enrich with player name (payload only carries ids).
          const { data: enriched } = await supabase
            .from("match_events")
            .select("player:players!match_events_player_id_fkey(name)")
            .eq("id", ev.id)
            .single();
          const player = one(enriched?.player as { name: string }[]);

          const payloadData: NotificationPayload = {
            leagueName: match.season_name,
            homeTeamName: match.home_short,
            awayTeamName: match.away_short,
            homeScore: match.home_score,
            awayScore: match.away_score,
            playerName: player?.name,
            quarterNumber: ev.period,
            setNumber: ev.period,
          };

          const toast = formatEventToast(match.sport_slug, ev.event_type, payloadData);
          if (!toast) return;

          showToast({
            emoji: toast.emoji,
            title: toast.title,
            body: toast.body,
            href: `/match/${match.id}`,
            shareText: formatWhatsAppMessage(match.sport_slug, ev.event_type, payloadData),
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [isAdmin, mapRow, showToast]);

  if (isAdmin || matches.length === 0) return null;

  return (
    <div className="bg-brand-blue text-white dark:bg-zinc-900 border-b border-blue-900/40 dark:border-zinc-800">
      <div className="max-w-2xl mx-auto px-4 py-2 flex items-center gap-3 overflow-x-auto scrollbar-hide">
        <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide shrink-0">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live
        </span>
        {matches.map((m) => (
          <Link
            key={m.id}
            href={`/match/${m.id}`}
            className="shrink-0 flex items-center gap-2 text-sm bg-white/10 hover:bg-white/20 rounded-full px-3 py-1 transition-colors"
          >
            <span>{m.sport_icon}</span>
            <span className="font-medium">{m.home_short}</span>
            <span className="font-bold tabular-nums">
              {m.home_score}–{m.away_score}
            </span>
            <span className="font-medium">{m.away_short}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
