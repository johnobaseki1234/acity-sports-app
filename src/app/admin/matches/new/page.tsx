import { createClient } from "@/lib/supabase/server";
import { MatchForm } from "@/components/admin/MatchForm";
import type { Season, Team } from "@/lib/supabase/types";

export default async function NewMatchPage() {
  const supabase = await createClient();
  const [{ data: seasons }, { data: teams }] = await Promise.all([
    supabase.from("seasons").select("*, sport:sports(*)").eq("is_active", true).order("name"),
    supabase.from("teams").select("*").order("name"),
  ]);

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Schedule Match</h1>
      <MatchForm seasons={(seasons ?? []) as Season[]} teams={(teams ?? []) as Team[]} />
    </div>
  );
}
