import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeStandings } from "@/lib/utils/standings";
import { SportIcon } from "@/components/ui/SportIcon";
import { Sparkles, Trophy, Swords } from "lucide-react";
import type { Match, Season, Sport, Team } from "@/lib/supabase/types";
import TeamForm from "@/components/matches/TeamForm";

const MATCH_SELECT = `
  *,
  home_team:teams!matches_home_team_id_fkey(*),
  away_team:teams!matches_away_team_id_fkey(*),
  season:seasons(*, sport:sports(*))
`;

const SPORT_SWITCHER = [
  { label: "Football",   slug: "football",   href: "/standings/football" },
  { label: "Basketball", slug: "basketball", href: "/standings/basketball" },
  { label: "Volleyball", slug: "volleyball", href: "/standings/volleyball" },
] as const;

export default async function StandingsPage({ params }: { params: Promise<{ sport: string }> }) {
  const { sport: sportSlug } = await params;
  const supabase = await createClient();

  const { data: sport } = await supabase
    .from("sports")
    .select("*")
    .eq("slug", sportSlug)
    .single();

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
        <PageHeader sport={sport as Sport} activeSportSlug={sportSlug} />
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
      <PageHeader sport={sport as Sport} season={season as Season} activeSportSlug={sportSlug} />

      {/* Regular Season Table */}
      <section>
        <SectionTitle icon={<Trophy className="h-5 w-5" />} label="Regular Season" />
        <div className="overflow-x-auto bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-lg">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-xs uppercase text-zinc-400 dark:text-zinc-500 sticky top-0">
              <tr>
                <th className="px-3 py-3.5 text-left font-bold">Team</th>
                <th className="px-2 py-3.5 text-center font-bold">P</th>
                <th className="px-2 py-3.5 text-center font-bold">W</th>
                {!isBasketball && <th className="px-2 py-3.5 text-center font-bold">D</th>}
                <th className="px-2 py-3.5 text-center font-bold">L</th>
                <th className="px-2 py-3.5 text-center font-bold">{isBasketball ? "PF" : "F"}</th>
                <th className="px-2 py-3.5 text-center font-bold">{isBasketball ? "PA" : "A"}</th>
                <th className="px-2 py-3.5 text-center font-bold">{isBasketball ? "+/−" : "GD"}</th>
                <th className="px-3 py-3.5 text-center font-bold">PTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-200">
              {table.map((row, index) => (
                <tr
                  key={row.team_id}
                  className={
                    index === 0
                      ? "bg-red-50/60 dark:bg-red-500/10"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                  }
                >
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`grid place-items-center w-6 h-6 rounded-lg text-[11px] font-black tabular-nums shrink-0 ${
                          index === 0 ? "bg-red-600 text-white" : "text-zinc-400"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span
                        className="h-7 w-7 rounded-lg shrink-0 hidden sm:block"
                        style={{ background: row.team?.primary_color ?? "#52525b" }}
                      />
                      <span className="font-bold text-zinc-900 dark:text-white truncate">
                        {row.team?.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-3.5 text-center tabular-nums">{row.played}</td>
                  <td className="px-2 py-3.5 text-center tabular-nums">{row.won}</td>
                  {!isBasketball && (
                    <td className="px-2 py-3.5 text-center tabular-nums">{row.drawn}</td>
                  )}
                  <td className="px-2 py-3.5 text-center tabular-nums">{row.lost}</td>
                  <td className="px-2 py-3.5 text-center tabular-nums">{row.goals_for}</td>
                  <td className="px-2 py-3.5 text-center tabular-nums">{row.goals_against}</td>
                  <td
                    className={`px-2 py-3.5 text-center tabular-nums font-semibold ${
                      row.goal_diff > 0
                        ? "text-green-600 dark:text-green-400"
                        : row.goal_diff < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-zinc-400"
                    }`}
                  >
                    {row.goal_diff > 0 ? "+" : ""}
                    {row.goal_diff}
                  </td>
                  <td className="px-3 py-3.5 text-center font-black tabular-nums text-zinc-900 dark:text-white">
                    {row.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

// ─── Football Cup Engine ────────────────────────────────────────────────────

type StandingRow = ReturnType<typeof computeStandings>[number];

function FootballCupSection({ teams }: { teams: StandingRow[] }) {
  const qualifiers = teams.slice(0, Math.min(4, teams.length));
  const hasFourTeams = qualifiers.length >= 4;

  return (
    <section>
      <SectionTitle icon={<Swords className="h-5 w-5" />} label="Cup Tournament" />
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-lg space-y-4">
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
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-lg space-y-4">
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
    <div className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-zinc-900">
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
}: {
  sport: Sport;
  season?: Season;
  activeSportSlug: string;
}) {
  return (
    <div className="space-y-3">
      <div>
        {season && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{season.name}</p>
        )}
        <h1 className="flex items-center gap-2.5 text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
          <SportIcon slug={sport.slug} className="h-8 w-8 text-red-600 dark:text-red-500" />
          {sport.name} Standings
        </h1>
      </div>
      {/* Global Sport Switcher */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {SPORT_SWITCHER.map(({ label, slug, href }) => (
          <Link
            key={label}
            href={href}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-300 ${
              slug === activeSportSlug
                ? "bg-red-600 text-white shadow-md shadow-red-600/25"
                : "bg-white/70 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"
            }`}
          >
            <SportIcon slug={slug} className="h-4 w-4" strokeWidth={2.25} />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 px-0.5">
      <span className="text-red-600 dark:text-red-500">{icon}</span>
      <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">{label}</h2>
    </div>
  );
}

function EmptyState({ sport, message }: { sport: Sport; message: string }) {
  return (
    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl py-16 text-center shadow-lg">
      <div className="mx-auto mb-3 grid place-items-center h-16 w-16 rounded-3xl bg-red-500/10 text-red-600 dark:text-red-500">
        <SportIcon slug={sport.slug} className="h-8 w-8" />
      </div>
      <p className="font-medium text-zinc-500 dark:text-zinc-400">{message}</p>
    </div>
  );
}
