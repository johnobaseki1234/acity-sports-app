import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Players</h1>
        <Link href="/admin/players/new" className="btn-primary">+ New Player</Link>
      </div>

      {players.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">👤</div>
          <p>No players yet. Add players to teams.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
          {players.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: p.team?.primary_color || "#1e3a5f" }}
              >
                {p.jersey_number}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{p.name}</div>
                <div className="text-xs text-gray-400">{p.position} · {p.team?.name}</div>
              </div>
              <Link href={`/admin/players/${p.id}`} className="text-sm text-blue-600 hover:underline shrink-0">
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
