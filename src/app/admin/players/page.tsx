import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, UserRound } from "lucide-react";
import type { Player } from "@/lib/supabase/types";

export default async function PlayersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("players")
    .select("*, team:teams(*)")
    .eq("is_active", true)
    .order("name");
  const players = (data ?? []) as Player[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Players</h1>
        <Link href="/admin/players/new" className="btn-primary gap-2"><Plus className="h-4 w-4" /> New Player</Link>
      </div>

      {players.length === 0 ? (
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl py-14 text-center shadow-lg">
          <div className="mx-auto mb-3 grid place-items-center h-16 w-16 rounded-3xl bg-vanguard-volt/10 text-vanguard-volt">
            <UserRound className="h-8 w-8" strokeWidth={1.75} />
          </div>
          <p className="text-zinc-500 dark:text-zinc-400">No players yet. Add players to teams.</p>
        </div>
      ) : (
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl divide-y divide-zinc-100 dark:divide-zinc-800 shadow-lg overflow-hidden">
          {players.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-5 py-4">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs font-black shrink-0 shadow-sm"
                style={{ backgroundColor: p.team?.primary_color || "#dc2626" }}
              >
                {p.jersey_number}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-zinc-900 dark:text-white truncate">{p.name}</div>
                <div className="text-xs text-zinc-400 truncate">{p.position} · {p.team?.name}</div>
              </div>
              <Link href={`/admin/players/${p.id}`} className="text-sm font-semibold text-vanguard-volt dark:text-vanguard-volt hover:underline shrink-0">
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
