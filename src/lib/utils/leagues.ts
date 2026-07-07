import type { SupabaseClient } from "@supabase/supabase-js";
import type { Season } from "@/lib/supabase/types";

/** All active seasons ("leagues") across every school, sport-joined for tag rendering. */
export async function getActiveSeasons(supabase: SupabaseClient): Promise<Season[]> {
  const { data } = await supabase
    .from("seasons")
    .select("*, sport:sports(*), school:schools(*)")
    .eq("is_active", true)
    .order("name");
  return (data ?? []) as Season[];
}
