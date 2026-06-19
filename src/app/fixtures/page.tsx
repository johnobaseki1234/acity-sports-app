import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMatchDate, formatMatchTime, getStatusLabel } from "@/lib/utils/match";
import { SportIcon } from "@/components/ui/SportIcon";
import { Sparkles, LayoutGrid } from "lucide-react";
import type { Match } from "@/lib/supabase/types";

const MATCH_SELECT = `
  *,
  home_team:teams!matches_home_team_id_fkey(*),
  away_team:teams!matches_away_team_id_fkey(*),
  season:seasons(*, sport:sports(*))
`;

const SPORT_SWITCHER = [
  { label: "All",        slug: null,         href: "/fixtures" },
  { label: "Football",   slug: "football",   href: "/fixtures/football" },
  { label: "Basketball", slug: "basketball", href: "/fixtures/basketball" },
  { label: "Volleyball", slug: "volleyball", href: "/fixtures/volleyball" },
] as const;

const STATUS_FILTERS = [
  { label: "All",      value: "all",       href: "/fixtures" },
  { label: "Upcoming", value: "scheduled", href: "/fixtures?status=scheduled" },
  { label: "Live",     value: "live",      href: "/fixtures?status=live" },
  { label: "Results",  value: "finished",  href: "/fixtures?status=finished" },
] as const;

export default async function AllFixturesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: rawStatus } = await searchParams;
  const selectedStatus = rawStatus ?? "all";

  const supabase = await createClient();
  const { data } = await supabase
    .from("matches")
    .select(MATCH_SELECT)
    .order("scheduled_at", { ascending: true });

  const allMatches = (data ?? []) as Match[];

  const filtered = allMatches.filter((m) => {
    if (selectedStatus === "all") return true;
    if (selectedStatus === "live") return m.status === "live" || m.status === "halftime";
    return m.status === selectedStatus;
  });

  const grouped = filtered.reduce<Record<string, Match[]>>((acc, m) => {
    const key = formatMatchDate(m.scheduled_at);
    (acc[key] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Header + Sport Switcher (Tier 1) */}
      <div className="space-y-3">
        <h1 className="flex items-center gap-2.5 text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
          <LayoutGrid className="h-8 w-8 text-red-600 dark:text-red-500" />
          Fixtures
        </h1>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {SPORT_SWITCHER.map(({ label, slug, href }) => (
            <SportSwitcherPill
              key={label}
              label={label}
              slug={slug ?? undefined}
              href={href}
              active={slug === null}
            />
          ))}
        </div>
      </div>

      {/* Status Pills (Tier 2) */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {STATUS_FILTERS.map(({ label, value, href }) => (
          <FilterLink key={value} label={label} href={href} active={selectedStatus === value} />
        ))}
      </div>

      {/* Match list */}
      <div className="space-y-5">
        {Object.entries(grouped).map(([date, dayMatches]) => (
          <section key={date}>
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-zinc-500 mb-2">
              {date}
            </h2>
            <div className="space-y-3">
              {dayMatches.map((match) => (
                <FixtureRow key={match.id} match={match} showSportBadge />
              ))}
            </div>
          </section>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl py-16 text-center shadow-lg">
          <div className="mx-auto mb-3 grid place-items-center h-16 w-16 rounded-3xl bg-red-500/10 text-red-600 dark:text-red-500">
            <LayoutGrid className="h-8 w-8" />
          </div>
          <p className="font-medium text-zinc-500 dark:text-zinc-400">No fixtures match these filters</p>
        </div>
      )}
    </div>
  );
}

function FixtureRow({ match, showSportBadge }: { match: Match; showSportBadge?: boolean }) {
  const showScore = match.status === "live" || match.status === "halftime" || match.status === "finished";
  const sportSlug = (match.season as any)?.sport?.slug as string | undefined;

  return (
    <Link href={`/match/${match.id}`} className="score-card block">
      <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
        <span className="flex items-center gap-1.5">
          {showSportBadge && sportSlug && (
            <SportIcon slug={sportSlug} className="h-3.5 w-3.5 text-zinc-400" strokeWidth={2} />
          )}
          {formatMatchTime(match.scheduled_at)} · {match.venue}
        </span>
        <span className="font-semibold">{getStatusLabel(match.status)}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="text-right font-semibold">{match.home_team?.name}</div>
        <div className="text-center font-black tabular-nums text-lg min-w-16">
          {showScore ? `${match.home_score} – ${match.away_score}` : "vs"}
        </div>
        <div className="font-semibold">{match.away_team?.name}</div>
      </div>
      {match.matchday && (
        <div className="mt-2 text-center text-xs text-gray-400">Matchday {match.matchday}</div>
      )}
    </Link>
  );
}

function SportSwitcherPill({
  label,
  slug,
  href,
  active,
}: {
  label: string;
  slug?: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-300 ${
        active
          ? "bg-red-600 text-white shadow-md shadow-red-600/25"
          : "bg-white/70 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"
      }`}
    >
      {slug ? (
        <SportIcon slug={slug} className="h-4 w-4" strokeWidth={2.25} />
      ) : (
        <Sparkles className="h-4 w-4" strokeWidth={2.25} />
      )}
      {label}
    </Link>
  );
}

function FilterLink({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
        active
          ? "bg-red-600 text-white shadow-md shadow-red-600/25"
          : "bg-white/70 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"
      }`}
    >
      {label}
    </Link>
  );
}
