import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { MatchForm } from "@/components/admin/MatchForm";
import type { Match, Season, Team } from "@/lib/supabase/types";

export default async function EditMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: match }, { data: seasons }, { data: teams }] = await Promise.all([
    supabase.from("matches").select("*").eq("id", id).single(),
    supabase.from("seasons").select("*, sport:sports(*)").order("name"),
    supabase.from("teams").select("*").order("name"),
  ]);
  if (!match) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Edit Match</h1>
      <MatchForm
        match={match as Match}
        seasons={(seasons ?? []) as Season[]}
        teams={(teams ?? []) as Team[]}
      />
    </div>
  );
}
