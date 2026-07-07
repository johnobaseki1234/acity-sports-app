import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeStandings } from "@/lib/utils/standings";
import { enrichBasketballStandings, type BasketballRow } from "@/lib/utils/basketballStandings";
import { SportIcon } from "@/components/ui/SportIcon";
import { LeagueTags } from "@/components/home/LeagueTags";
import { getActiveSeasons } from "@/lib/utils/leagues";
import { Trophy, Swords } from "lucide-react";
import type { Match, Season, Sport, Team } from "@/lib/supabase/types";

type FormResult = "W" | "D" | "L";

/** Last 5 results for a team, oldest → newest, from the season's match list. */
function computeForm(teamId: string, matches: Match[]): FormResult[] {
  return matches
    .filter(
      (m) =>
        m.status === "finished" &&
        (m.home_team_id === teamId || m.away_team_id === teamId)
    )
    .slice(-5)
    .map((m) => {
      const isHome = m.home_team_id === teamId;
      const us = isHome ? m.home_score : m.away_score;
      const them = isHome ? m.away_score : m.home_score;
      return us > them ? "W" : us < them ? "L" : "D";
    });
}

const MATCH_SELECT = `
  *,
  home_team:teams!matches_home_team_id_fkey(*),
  away_team:teams!matches_away_team_id_fkey(*),
  season:seasons(*, sport:sports(*))
`;

export default async function StandingsPage({ params }: { params: Promise<{ sport: string }> }) {
  const { sport: sportSlug } = await params;
  const supabase = await createClient();

  const [{ data: sport }, allSeasons] = await Promise.all([
    supabase.from("sports").select("*").eq("slug", sportSlug).single(),
    getActiveSeasons(supabase),
  ]);

  if (!sport) notFound();

  const { data: season } = await supabase
    .from("seasons")
    .select("*, sport:sports(*)")
    .eq("sport_id", sport.id)
    .eq("is_active", true)
    .single();

  if (!season) {
    return (
      <div className="space-y-6">
        <PageHeader sport={sport as Sport} activeSportSlug={sportSlug} seasons={allSeasons} />
        <EmptyState sport={sport as Sport} message="No active season yet" />
      </div>
    );
  }

  const [{ data: seasonTeams }, { data: matches }] = await Promise.all([
    supabase
      .from("season_teams")
      .select("team:teams(*)")
      .eq("season_id", season.id),
    supabase
      .from("matches")
      .select(MATCH_SELECT)
      .eq("season_id", season.id)
      .order("scheduled_at", { ascending: true }),
  ]);

  const teams = (seasonTeams ?? [])
    .map((row) => row.team)
    .filter(Boolean) as unknown as Team[];

  const table = computeStandings({
    teams,
    matches: (matches ?? []) as Match[],
    season: season as Season,
  });

  const isBasketball = sportSlug === "basketball";
  const isFootball = sportSlug === "football";

  return (
    <div className="space-y-8">
      <PageHeader sport={sport as Sport} season={season as Season} activeSportSlug={sportSlug} seasons={allSeasons} />

      {/* Regular Season */}
      <section>
        <SectionTitle icon={<Trophy className="h-5 w-5" />} label="Regular Season" />
        {isBasketball ? (
          <BasketballStandingsTable
            rows={enrichBasketballStandings(table, (matches ?? []) as Match[])}
            leagueName={season?.name}
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-900/70 backdrop-blur-xl">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-white/[0.03] border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="pl-3 pr-1 py-2.5 text-left font-black w-8">#</th>
                  <th className="px-2 py-2.5 text-left font-black">Team</th>
                  <th className="px-1.5 py-2.5 text-center font-black">P</th>
                  <th className="px-1.5 py-2.5 text-center font-black">W</th>
                  <th className="px-1.5 py-2.5 text-center font-black">D</th>
                  <th className="px-1.5 py-2.5 text-center font-black">L</th>
                  <th className="px-1.5 py-2.5 text-center font-black hidden sm:table-cell">F</th>
                  <th className="px-1.5 py-2.5 text-center font-black hidden sm:table-cell">A</th>
                  <th className="px-1.5 py-2.5 text-center font-black">GD</th>
                  <th className="px-2 py-2.5 text-center font-black text-vanguard-volt">PTS</th>
                  <th className="px-3 py-2.5 text-right font-black">Form</th>
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                {table.map((row, index) => {
                  const isLeader = index === 0;
                  const isCutoff = index === 3 && table.length > 4;
                  const form = computeForm(row.team_id, (matches ?? []) as Match[]);
                  return (
                    <tr
                      key={row.team_id}
                      className={`h-10 transition-colors hover:bg-white/[0.04] ${
                        isLeader ? "bg-vanguard-volt/[0.06]" : ""
                      } ${
                        isCutoff
                          ? "border-b-2 border-vanguard-volt/30"
                          : "border-b border-white/5"
                      }`}
                    >
                      <td className="pl-3 pr-1 py-1.5">
                        <span
                          className={`grid place-items-center w-5 h-5 rounded text-[10px] font-black tabular-nums ${
                            isLeader
                              ? "bg-vanguard-volt text-black shadow-sm shadow-vanguard-volt/40"
                              : index < 4
                              ? "text-vanguard-volt border border-vanguard-volt/30"
                              : "text-zinc-500"
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="grid place-items-center h-5 w-5 rounded text-[8px] font-black text-white shrink-0"
                            style={{ background: row.team?.primary_color ?? "#52525b" }}
                          >
                            {row.team?.short_name?.slice(0, 2).toUpperCase()}
                          </span>
                          <span className={`truncate text-[13px] ${isLeader ? "font-black text-white" : "font-semibold text-zinc-200"}`}>
                            {row.team?.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-1.5 py-1.5 text-center tabular-nums text-xs">{row.played}</td>
                      <td className="px-1.5 py-1.5 text-center tabular-nums text-xs font-bold text-zinc-200">{row.won}</td>
                      <td className="px-1.5 py-1.5 text-center tabular-nums text-xs">{row.drawn}</td>
                      <td className="px-1.5 py-1.5 text-center tabular-nums text-xs">{row.lost}</td>
                      <td className="px-1.5 py-1.5 text-center tabular-nums text-xs hidden sm:table-cell">{row.goals_for}</td>
                      <td className="px-1.5 py-1.5 text-center tabular-nums text-xs hidden sm:table-cell">{row.goals_against}</td>
                      <td
                        className={`px-1.5 py-1.5 text-center tabular-nums text-xs font-black ${
                          row.goal_diff > 0
                            ? "text-vanguard-volt"
                            : row.goal_diff < 0
                            ? "text-vanguard-crimson"
                            : "text-zinc-500"
                        }`}
                      >
                        {row.goal_diff > 0 ? "+" : ""}
                        {row.goal_diff}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <span className={`text-sm font-black tabular-nums ${isLeader ? "text-vanguard-volt" : "text-white"}`}>
                          {row.points}
                        </span>
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="flex items-center justify-end gap-1">
                          {form.length === 0 ? (
                            <span className="text-[10px] text-zinc-600">—</span>
                          ) : (
                            form.map((r, i) => <FormBlock key={i} result={r} latest={i === form.length - 1} />)
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center gap-4 mt-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-vanguard-volt" /> Playoff line (top 4)
          </span>
          {!isBasketball && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-vanguard-crimson" /> Loss form
            </span>
          )}
        </div>
        {table.length === 0 && (
          <EmptyState sport={sport as Sport} message="No teams have been added to this season" />
        )}
      </section>

      {/* Competition Engine */}
      {isFootball && table.length >= 2 && (
        <FootballCupSection teams={table} />
      )}
      {isBasketball && table.length >= 2 && (
        <BasketballPlayoffsSection teams={table} />
      )}
    </div>
  );
}

// ─── Basketball NBA/NCAA Record Grid ─────────────────────────────────────────

function BasketballStandingsTable({
  rows,
  leagueName,
}: {
  rows: BasketballRow[];
  leagueName?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-900/70 backdrop-blur-xl">
      {leagueName && (
        <div className="px-3 py-2 border-b border-white/10 bg-white/[0.03]">
          <span className="text-[10px] font-black uppercase tracking-widest text-vanguard-volt">
            {leagueName}
          </span>
        </div>
      )}
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-white/[0.03] border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-500">
          <tr>
            <th className="pl-3 pr-1 py-2.5 text-left font-black w-8">#</th>
            <th className="px-2 py-2.5 text-left font-black">Team</th>
            <th className="px-1.5 py-2.5 text-center font-black">W-L</th>
            <th className="px-1.5 py-2.5 text-center font-black">WIN%</th>
            <th className="px-1.5 py-2.5 text-center font-black">GB</th>
            <th className="px-1.5 py-2.5 text-center font-black hidden sm:table-cell">PF</th>
            <th className="px-1.5 py-2.5 text-center font-black hidden sm:table-cell">PA</th>
            <th className="px-3 py-2.5 text-right font-black">Streak</th>
          </tr>
        </thead>
        <tbody className="text-zinc-300">
          {rows.map((row, index) => {
            const isLeader = index === 0;
            const isCutoff = index === 3 && rows.length > 4;
            return (
              <tr
                key={row.team_id}
                className={`h-10 transition-colors hover:bg-white/[0.04] ${
                  isLeader ? "bg-vanguard-volt/[0.06]" : ""
                } ${isCutoff ? "border-b-2 border-vanguard-volt/30" : "border-b border-white/5"}`}
              >
                <td className="pl-3 pr-1 py-1.5">
                  <span
                    className={`grid place-items-center w-5 h-5 rounded text-[10px] font-black tabular-nums ${
                      isLeader
                        ? "bg-vanguard-volt text-black shadow-sm shadow-vanguard-volt/40"
                        : index < 4
                        ? "text-vanguard-volt border border-vanguard-volt/30"
                        : "text-zinc-500"
                    }`}
                  >
                    {index + 1}
                  </span>
                </td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="grid place-items-center h-5 w-5 rounded text-[8px] font-black text-white shrink-0"
                      style={{ background: row.team?.primary_color ?? "#52525b" }}
                    >
                      {row.team?.short_name?.slice(0, 2).toUpperCase()}
                    </span>
                    <span className={`truncate text-[13px] ${isLeader ? "font-black text-white" : "font-semibold text-zinc-200"}`}>
                      {row.team?.name}
                    </span>
                  </div>
                </td>
                <td className="px-1.5 py-1.5 text-center tabular-nums text-xs font-bold text-zinc-100">
                  {row.won}-{row.lost}
                </td>
                <td className="px-1.5 py-1.5 text-center tabular-nums text-xs font-black text-vanguard-volt">
                  .{Math.round(row.winPct * 1000).toString().padStart(3, "0")}
                </td>
                <td className="px-1.5 py-1.5 text-center tabular-nums text-xs text-zinc-400">
                  {row.gamesBehind === 0 ? "—" : row.gamesBehind.toFixed(1)}
                </td>
                <td className="px-1.5 py-1.5 text-center tabular-nums text-xs hidden sm:table-cell">{row.goals_for}</td>
                <td className="px-1.5 py-1.5 text-center tabular-nums text-xs hidden sm:table-cell">{row.goals_against}</td>
                <td className="px-3 py-1.5 text-right">
                  {row.streak ? (
                    <span
                      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums ${
                        row.streak.result === "W"
                          ? "bg-vanguard-volt/15 text-vanguard-volt"
                          : "bg-vanguard-crimson/15 text-vanguard-crimson"
                      }`}
                    >
                      {row.streak.result}{row.streak.count}
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-600">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Football Cup Engine ────────────────────────────────────────────────────

type StandingRow = ReturnType<typeof computeStandings>[number];

function FootballCupSection({ teams }: { teams: StandingRow[] }) {
  const qualifiers = teams.slice(0, Math.min(4, teams.length));
  const hasFourTeams = qualifiers.length >= 4;

  return (
    <section>
      <SectionTitle icon={<Swords className="h-5 w-5" />} label="Cup Tournament" />
      <div className="rounded-2xl border border-white/10 bg-zinc-900/70 backdrop-blur-xl p-5 space-y-4">
        <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wide">
          Single-elimination · Top {qualifiers.length} from regular season
        </p>

        {hasFourTeams ? (
          <div className="overflow-x-auto">
            <div className="min-w-[480px] grid grid-cols-[1fr_60px_1fr_60px_1fr] items-center gap-0">
              {/* Semis column */}
              <div className="space-y-8">
                <BracketMatchup
                  teamA={{ name: qualifiers[0]?.team?.name ?? "—", seed: 1, color: qualifiers[0]?.team?.primary_color }}
                  teamB={{ name: qualifiers[3]?.team?.name ?? "—", seed: 4, color: qualifiers[3]?.team?.primary_color }}
                  label="Semi-final 1"
                />
                <BracketMatchup
                  teamA={{ name: qualifiers[1]?.team?.name ?? "—", seed: 2, color: qualifiers[1]?.team?.primary_color }}
                  teamB={{ name: qualifiers[2]?.team?.name ?? "—", seed: 3, color: qualifiers[2]?.team?.primary_color }}
                  label="Semi-final 2"
                />
              </div>

              {/* Connector arrows */}
              <div className="flex flex-col items-center justify-center h-full gap-8 pt-8">
                <BracketArrow />
                <BracketArrow />
              </div>

              {/* Final column */}
              <div className="flex items-center justify-center h-full">
                <BracketMatchup
                  teamA={{ name: "Winner SF1", seed: undefined }}
                  teamB={{ name: "Winner SF2", seed: undefined }}
                  label="Final"
                  pending
                />
              </div>

              <div className="flex items-center justify-center">
                <BracketArrow />
              </div>

              {/* Champion */}
              <div className="flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center shadow-lg shadow-amber-500/30">
                    <Trophy className="h-7 w-7 text-white" />
                  </div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Champion</p>
                  <p className="text-sm font-black text-zinc-900 dark:text-white">TBD</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Top teams will qualify once more matches are played.
            </p>
            <div className="flex flex-wrap gap-2">
              {qualifiers.map((row, i) => (
                <div
                  key={row.team_id}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                >
                  <span
                    className="h-4 w-4 rounded-md shrink-0"
                    style={{ background: row.team?.primary_color ?? "#52525b" }}
                  />
                  <span className="text-xs font-bold text-zinc-500">#{i + 1}</span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {row.team?.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Basketball Playoffs Engine ──────────────────────────────────────────────

function BasketballPlayoffsSection({ teams }: { teams: StandingRow[] }) {
  const seeds = teams.slice(0, Math.min(4, teams.length));
  const hasFourTeams = seeds.length >= 4;

  return (
    <section>
      <SectionTitle icon={<Swords className="h-5 w-5" />} label="Post-Season Playoffs" />
      <div className="rounded-2xl border border-white/10 bg-zinc-900/70 backdrop-blur-xl p-5 space-y-4">
        <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wide">
          NBA-style · Best of 3 · Top {seeds.length} from regular season
        </p>

        {hasFourTeams ? (
          <div className="overflow-x-auto">
            <div className="min-w-[480px] grid grid-cols-[1fr_60px_1fr_60px_1fr] items-center gap-0">
              {/* Semis */}
              <div className="space-y-8">
                <BracketMatchup
                  teamA={{ name: seeds[0]?.team?.name ?? "—", seed: 1, color: seeds[0]?.team?.primary_color }}
                  teamB={{ name: seeds[3]?.team?.name ?? "—", seed: 4, color: seeds[3]?.team?.primary_color }}
                  label="Semi-final 1"
                  seriesLabel="Best of 3"
                />
                <BracketMatchup
                  teamA={{ name: seeds[1]?.team?.name ?? "—", seed: 2, color: seeds[1]?.team?.primary_color }}
                  teamB={{ name: seeds[2]?.team?.name ?? "—", seed: 3, color: seeds[2]?.team?.primary_color }}
                  label="Semi-final 2"
                  seriesLabel="Best of 3"
                />
              </div>

              <div className="flex flex-col items-center justify-center h-full gap-8 pt-8">
                <BracketArrow />
                <BracketArrow />
              </div>

              {/* Finals */}
              <div className="flex items-center justify-center h-full">
                <BracketMatchup
                  teamA={{ name: "Winner SF1", seed: undefined }}
                  teamB={{ name: "Winner SF2", seed: undefined }}
                  label="Championship"
                  seriesLabel="Best of 3"
                  pending
                />
              </div>

              <div className="flex items-center justify-center">
                <BracketArrow />
              </div>

              {/* Champion */}
              <div className="flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center shadow-lg shadow-amber-500/30">
                    <Trophy className="h-7 w-7 text-white" />
                  </div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Champion</p>
                  <p className="text-sm font-black text-zinc-900 dark:text-white">TBD</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Top 4 teams will qualify for the playoffs once more games are played.
            </p>
            <div className="flex flex-wrap gap-2">
              {seeds.map((row, i) => (
                <div
                  key={row.team_id}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                >
                  <span
                    className="h-4 w-4 rounded-md shrink-0"
                    style={{ background: row.team?.primary_color ?? "#52525b" }}
                  />
                  <span className="text-xs font-bold text-zinc-500">#{i + 1}</span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {row.team?.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Shared Bracket Components ───────────────────────────────────────────────

function BracketMatchup({
  teamA,
  teamB,
  label,
  seriesLabel,
  pending,
}: {
  teamA: { name: string; seed?: number; color?: string | null };
  teamB: { name: string; seed?: number; color?: string | null };
  label: string;
  seriesLabel?: string;
  pending?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
        {label}
        {seriesLabel && (
          <span className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-400 normal-case font-semibold tracking-normal">
            {seriesLabel}
          </span>
        )}
      </p>
      <div
        className={`rounded-2xl border divide-y overflow-hidden ${
          pending
            ? "border-zinc-200 dark:border-zinc-700 divide-zinc-100 dark:divide-zinc-800 opacity-60"
            : "border-zinc-200 dark:border-zinc-700 divide-zinc-100 dark:divide-zinc-800"
        }`}
      >
        <BracketTeamRow name={teamA.name} seed={teamA.seed} color={teamA.color} />
        <BracketTeamRow name={teamB.name} seed={teamB.seed} color={teamB.color} />
      </div>
    </div>
  );
}

function BracketTeamRow({
  name,
  seed,
  color,
}: {
  name: string;
  seed?: number;
  color?: string | null;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-zinc-900">
      {seed !== undefined && (
        <span className="text-[10px] font-black text-zinc-400 w-3 shrink-0">{seed}</span>
      )}
      {color && (
        <span
          className="h-3 w-3 rounded-sm shrink-0"
          style={{ background: color }}
        />
      )}
      <span className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{name}</span>
    </div>
  );
}

function BracketArrow() {
  return (
    <svg width="40" height="24" viewBox="0 0 40 24" fill="none" className="text-zinc-300 dark:text-zinc-600">
      <path d="M0 12 H32 M32 12 L24 6 M32 12 L24 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Page Chrome ─────────────────────────────────────────────────────────────

function PageHeader({
  sport,
  season,
  activeSportSlug,
  seasons,
}: {
  sport: Sport;
  season?: Season;
  activeSportSlug: string;
  seasons: Season[];
}) {
  return (
    <div className="space-y-3">
      <div>
        {season && (
          <p className="text-sm text-zinc-400">{season.name}</p>
        )}
        <h1 className="flex items-center gap-2.5 text-4xl font-black tracking-tight text-white">
          <SportIcon slug={sport.slug} className="h-8 w-8 text-vanguard-volt" />
          {sport.name} Standings
        </h1>
      </div>
      <LeagueTags mode="standings" seasons={seasons} activeSportSlug={activeSportSlug} />
    </div>
  );
}

function FormBlock({ result, latest }: { result: FormResult; latest?: boolean }) {
  const styles: Record<FormResult, string> = {
    W: "bg-vanguard-volt text-black shadow-sm shadow-vanguard-volt/50",
    L: "bg-vanguard-crimson text-white shadow-sm shadow-vanguard-crimson/50",
    D: "bg-zinc-700 text-zinc-300",
  };
  return (
    <span
      title={result === "W" ? "Win" : result === "L" ? "Loss" : "Draw"}
      className={`grid place-items-center h-[18px] w-[18px] rounded text-[9px] font-black select-none ${styles[result]} ${
        latest ? "ring-1 ring-white/40" : ""
      }`}
    >
      {result}
    </span>
  );
}

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 px-0.5">
      <span className="text-vanguard-volt">{icon}</span>
      <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">{label}</h2>
    </div>
  );
}

function EmptyState({ sport, message }: { sport: Sport; message: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/70 backdrop-blur-xl py-16 text-center">
      <div className="mx-auto mb-3 grid place-items-center h-16 w-16 rounded-3xl bg-vanguard-volt/10 text-vanguard-volt">
        <SportIcon slug={sport.slug} className="h-8 w-8" />
      </div>
      <p className="font-medium text-zinc-500 dark:text-zinc-400">{message}</p>
    </div>
  );
}
