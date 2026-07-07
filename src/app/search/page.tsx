"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import Link from "next/link";
import {
  Search as SearchIcon,
  SearchX,
  Loader2,
  Shield,
  UserRound,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { MatchStatus } from "../../lib/supabase/types";

type TeamResult = {
  id: string;
  name: string;
  short_name: string;
  slug: string;
};

type PlayerResult = {
  id: string;
  name: string;
  jersey_number: number;
  team?: { name: string } | null;
};

type MatchResult = {
  id: string;
  venue: string;
  status: MatchStatus;
  home_team?: { name: string; short_name: string } | null;
  away_team?: { name: string; short_name: string } | null;
};

interface SearchResults {
  teams: TeamResult[];
  players: PlayerResult[];
  matches: MatchResult[];
}

const EMPTY_RESULTS: SearchResults = {
  teams: [],
  players: [],
  matches: [],
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const searchTerm = query.trim();
    const delayDebounceId = setTimeout(async () => {
      if (searchTerm.length < 2) {
        setResults(EMPTY_RESULTS);
        setError("");
        return;
      }

      setLoading(true);
      setError("");
      try {
        const escapedTerm = searchTerm.replaceAll("%", "\\%").replaceAll("_", "\\_");
        const pattern = `%${escapedTerm}%`;
        const [teamResponse, playerResponse, matchResponse] = await Promise.all([
          supabase
            .from("teams")
            .select("id, name, short_name, slug")
            .or(`name.ilike.${pattern},short_name.ilike.${pattern}`)
            .limit(5),
          supabase
            .from("players")
            .select(`
              id,
              name,
              jersey_number,
              team:teams(name)
            `)
            .ilike("name", pattern)
            .limit(5),
          supabase
            .from("matches")
            .select(`
              id,
              venue,
              status,
              home_team:teams!matches_home_team_id_fkey(name, short_name),
              away_team:teams!matches_away_team_id_fkey(name, short_name)
            `)
            .ilike("venue", pattern)
            .limit(5),
        ]);

        const firstError = teamResponse.error || playerResponse.error || matchResponse.error;
        if (firstError) {
          throw firstError;
        }

        setResults({
          teams: (teamResponse.data ?? []) as TeamResult[],
          players: (playerResponse.data ?? []).map((player) => ({
            ...player,
            team: Array.isArray(player.team) ? player.team[0] ?? null : player.team,
          })) as PlayerResult[],
          matches: (matchResponse.data ?? []).map((match) => ({
            ...match,
            home_team: Array.isArray(match.home_team) ? match.home_team[0] ?? null : match.home_team,
            away_team: Array.isArray(match.away_team) ? match.away_team[0] ?? null : match.away_team,
          })) as MatchResult[],
        });
      } catch (err) {
        setResults(EMPTY_RESULTS);
        setError(err instanceof Error ? err.message : "Search failed.");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceId);
  }, [query, supabase]);

  const hasResults =
    results.teams.length + results.players.length + results.matches.length > 0;

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Search</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Teams, players and match venues across every league.</p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          placeholder="Search teams, players, or venues…"
          className="w-full h-14 pl-12 pr-12 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 shadow-lg focus:ring-2 focus:ring-vanguard-volt focus:border-transparent outline-none transition-all duration-300 text-zinc-800 dark:text-zinc-100 font-medium"
        />
        {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-vanguard-volt animate-spin" />}
      </div>

      {error && (
        <div className="text-sm text-vanguard-crimson bg-vanguard-crimson/10 rounded-2xl px-4 py-3">{error}</div>
      )}

      {query.trim().length < 2 ? (
        <EmptyState Icon={SearchIcon} title="Start typing to search" message="Enter at least 2 characters to find teams, players and venues." />
      ) : !hasResults ? (
        <EmptyState Icon={SearchX} title="No results found" message={`Nothing matched “${query.trim()}”. Try a different term.`} />
      ) : (
        <div className="space-y-7">
          <ResultSection Icon={Shield} title="Teams" count={results.teams.length}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.teams.map((team) => (
                <Link key={team.id} href={`/team/${team.slug}`} className="score-card flex items-center gap-3">
                  <span className="grid place-items-center h-10 w-10 rounded-2xl bg-vanguard-volt text-black text-[11px] font-black shrink-0">
                    {team.short_name?.slice(0, 3).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="font-bold text-zinc-800 dark:text-zinc-100 block truncate">{team.name}</span>
                    <span className="text-xs text-zinc-400 uppercase tracking-wider">{team.short_name}</span>
                  </span>
                </Link>
              ))}
            </div>
          </ResultSection>

          <ResultSection Icon={UserRound} title="Players" count={results.players.length}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.players.map((player) => (
                <Link key={player.id} href={`/player/${player.id}`} className="score-card flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="grid place-items-center h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-300 text-xs font-bold shrink-0">
                      #{player.jersey_number}
                    </span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-100 truncate">{player.name}</span>
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg shrink-0">
                    {player.team?.name || "No Team"}
                  </span>
                </Link>
              ))}
            </div>
          </ResultSection>

          <ResultSection Icon={MapPin} title="Match Venues" count={results.matches.length}>
            <div className="space-y-3">
              {results.matches.map((match) => (
                <Link key={match.id} href={`/match/${match.id}`} className="score-card flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-100 block">
                      {match.home_team?.short_name} <span className="text-zinc-400 font-normal">vs</span> {match.away_team?.short_name}
                    </span>
                    <span className="text-xs text-zinc-400 flex items-center gap-1"><MapPin className="h-3 w-3" /> {match.venue}</span>
                  </div>
                  <span className="text-[11px] font-bold uppercase px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-300 rounded-full shrink-0">
                    {match.status}
                  </span>
                </Link>
              ))}
            </div>
          </ResultSection>
        </div>
      )}
    </div>
  );
}

function ResultSection({
  Icon,
  title,
  count,
  children,
}: {
  Icon: LucideIcon;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section>
      <div className="flex items-center gap-2 mb-3 px-0.5">
        <Icon className="h-5 w-5 text-vanguard-volt" strokeWidth={2.25} />
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">{title}</h2>
        <span className="rounded-full bg-vanguard-volt/10 dark:bg-vanguard-volt/20 text-vanguard-volt dark:text-vanguard-volt text-xs font-bold px-2 py-0.5">{count}</span>
      </div>
      {children}
    </section>
  );
}
