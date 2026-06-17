import { createClient } from "@/lib/supabase/server";
import { SeasonForm } from "@/components/admin/SeasonForm";
import type { Sport } from "@/lib/supabase/types";

export default async function NewSeasonPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("sports").select("*").order("name");
  const sports = (data ?? []) as Sport[];

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">New Season</h1>
      <SeasonForm sports={sports} />
    </div>
  );
}
