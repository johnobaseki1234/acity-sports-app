import { createClient } from "@/lib/supabase/server";
import type { School, Season } from "@/lib/supabase/types";
import { OnboardingGrid } from "./OnboardingGrid";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const [{ data: schools }, { data: seasons }] = await Promise.all([
    supabase.from("schools").select("*").order("name"),
    supabase
      .from("seasons")
      .select("*, sport:sports(*), school:schools(*)")
      .order("name"),
  ]);

  return (
    <div className="min-h-screen bg-vanguard-charcoal flex items-center justify-center px-4 py-10">
      <OnboardingGrid
        schools={(schools ?? []) as School[]}
        seasons={(seasons ?? []) as Season[]}
      />
    </div>
  );
}
