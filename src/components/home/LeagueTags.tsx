"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { Season } from "@/lib/supabase/types";
import { SportIcon } from "@/components/ui/SportIcon";
import { leagueTagLabel } from "@/lib/utils/leagueLabel";
import { useLeagueOfInterest } from "@/hooks/useLeagueOfInterest";

const DEFAULT_TAG_LABELS = ["ACFL", "ACBL"];

/** The seasons a visitor actually cares about: their saved picks, or the platform default. */
function interestedSeasons(seasons: Season[], leagueIds: string[]): Season[] {
  if (leagueIds.length > 0) {
    const byId = new Set(leagueIds);
    const picked = seasons.filter((s) => byId.has(s.id));
    if (picked.length > 0) return picked;
  }
  return seasons.filter((s) => DEFAULT_TAG_LABELS.includes(leagueTagLabel(s)));
}

type FilterProps = {
  mode: "filter";
  seasons: Season[];
  basePath: string;
  activeSeasonId?: string;
};

type RouteProps = {
  mode: "route";
  seasons: Season[];
  activeSportSlug: string;
  /** Path prefix a tag routes to, e.g. "/standings" → /standings/basketball. */
  routeBase: string;
};

export function LeagueTags(props: FilterProps | RouteProps) {
  const { leagueIds } = useLeagueOfInterest();
  const tags = interestedSeasons(props.seasons, leagueIds);

  if (tags.length === 0) return null;

  if (props.mode === "route") {
    return (
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {tags.map((season) => {
          const active = season.sport?.slug === props.activeSportSlug;
          return (
            <Link
              key={season.id}
              href={`${props.routeBase}/${season.sport?.slug}`}
              className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                active
                  ? "bg-vanguard-volt text-black shadow-md shadow-vanguard-volt/25"
                  : "glass text-zinc-300 hover:bg-white/5"
              }`}
            >
              <SportIcon slug={season.sport?.slug} className="h-4 w-4" strokeWidth={2.25} />
              {leagueTagLabel(season)}
            </Link>
          );
        })}
      </div>
    );
  }

  const { basePath, activeSeasonId } = props;

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      <Link
        href={basePath}
        className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-300 ${
          !activeSeasonId
            ? "bg-vanguard-volt text-black shadow-md shadow-vanguard-volt/25"
            : "glass text-zinc-300 hover:bg-white/5"
        }`}
      >
        <Sparkles className="h-4 w-4" strokeWidth={2.25} />
        All
      </Link>
      {tags.map((season) => {
        const active = activeSeasonId === season.id;
        return (
          <Link
            key={season.id}
            href={`${basePath}?league=${season.id}`}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-300 ${
              active
                ? "bg-vanguard-volt text-black shadow-md shadow-vanguard-volt/25"
                : "glass text-zinc-300 hover:bg-white/5"
            }`}
          >
            <SportIcon slug={season.sport?.slug} className="h-4 w-4" strokeWidth={2.25} />
            {leagueTagLabel(season)}
          </Link>
        );
      })}
    </div>
  );
}
