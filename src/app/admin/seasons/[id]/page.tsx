import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { SeasonForm } from "@/components/admin/SeasonForm";
import type { Season, Sport } from "@/lib/supabase/types";

export default async function EditSeasonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: season }, { data: sports }] = await Promise.all([
    supabase.from("seasons").select("*, sport:sports(*)").eq("id", id).single(),
    supabase.from("sports").select("*").order("name"),
  ]);
  if (!season) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Edit Season</h1>
      <SeasonForm season={season as Season} sports={(sports ?? []) as Sport[]} />
    </div>
  );
}
