import type { Season } from "@/lib/supabase/types";

/** Compact tag label for a season, e.g. "ACFL Season 1" → "ACFL". */
export function leagueTagLabel(season: Pick<Season, "name">): string {
  const match = season.name.match(/^[A-Z]{2,6}\b/);
  return match ? match[0] : season.name;
}
