import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TeamForm } from "@/components/admin/TeamForm";
import type { Team } from "@/lib/supabase/types";

export default async function EditTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("teams").select("*").eq("id", id).single();
  if (!data) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Edit Team</h1>
      <TeamForm team={data as Team} />
    </div>
  );
}
