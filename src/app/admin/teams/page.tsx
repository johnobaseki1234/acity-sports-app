import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Shield } from "lucide-react";
import type { Team } from "@/lib/supabase/types";

export default async function TeamsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("teams").select("*").order("name");
  const teams = (data ?? []) as Team[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Teams</h1>
        <Link href="/admin/teams/new" className="btn-primary gap-2"><Plus className="h-4 w-4" /> New Team</Link>
      </div>

      {teams.length === 0 ? (
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl py-14 text-center shadow-lg">
          <div className="mx-auto mb-3 grid place-items-center h-16 w-16 rounded-3xl bg-vanguard-volt/10 text-vanguard-volt">
            <Shield className="h-8 w-8" strokeWidth={1.75} />
          </div>
          <p className="text-zinc-500 dark:text-zinc-400">No teams yet. Add your first team to get started.</p>
        </div>
      ) : (
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl divide-y divide-zinc-100 dark:divide-zinc-800 shadow-lg overflow-hidden">
          {teams.map((team) => (
            <div key={team.id} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs font-black shadow-sm"
                  style={{ backgroundColor: team.primary_color || "#dc2626" }}
                >
                  {team.short_name?.slice(0, 3).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-sm text-zinc-900 dark:text-white">{team.name}</div>
                  <div className="text-xs text-zinc-400">{team.short_name}</div>
                </div>
              </div>
              <Link href={`/admin/teams/${team.id}`} className="text-sm font-semibold text-vanguard-volt dark:text-vanguard-volt hover:underline">
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
