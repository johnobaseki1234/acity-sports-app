"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import Link from "next/link";
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Global Search</h1>

      <div className="relative mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search teams, players, or match venues..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-700 bg-white"
        />
        {loading && (
          <div className="absolute right-4 top-3.5 flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
          </div>
        )}
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-6">{error}</div>}

      {query.trim().length < 2 ? (
        <p className="text-gray-400 text-sm text-center py-8">Type at least 2 characters to start searching.</p>
      ) : (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-bold text-gray-700 border-b pb-2 mb-3">Teams</h2>
            {results.teams.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No teams match your search.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.teams.map((team) => (
                  <Link href={`/team/${team.slug}`} key={team.id} className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-blue-400 transition block">
                    <span className="font-semibold text-gray-800 block">{team.name}</span>
                    <span className="text-xs text-gray-400 uppercase tracking-wider">{team.short_name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-700 border-b pb-2 mb-3">Players</h2>
            {results.players.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No players match your search.</p>
            ) : (
              <div className="space-y-2">
                {results.players.map((player) => (
                  <Link href={`/player/${player.id}`} key={player.id} className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-blue-400 transition flex justify-between items-center gap-3">
                    <div className="min-w-0">
                      <span className="font-medium text-gray-800 mr-2">#{player.jersey_number}</span>
                      <span className="text-gray-700 font-medium">{player.name}</span>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border shrink-0">
                      {player.team?.name || "No Team"}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-700 border-b pb-2 mb-3">Match Venues</h2>
            {results.matches.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No matching venues found.</p>
            ) : (
              <div className="space-y-2">
                {results.matches.map((match) => (
                  <Link href={`/match/${match.id}`} key={match.id} className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-blue-400 transition flex justify-between items-center gap-3 text-sm">
                    <div className="min-w-0">
                      <span className="text-gray-700 block">
                        <strong>{match.home_team?.short_name}</strong> vs <strong>{match.away_team?.short_name}</strong>
                      </span>
                      <span className="text-xs text-gray-400">{match.venue}</span>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded capitalize shrink-0">
                      {match.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
