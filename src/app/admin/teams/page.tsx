import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Team } from "@/lib/supabase/types";

export default async function TeamsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("teams").select("*").order("name");
  const teams = (data ?? []) as Team[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Teams</h1>
        <Link href="/admin/teams/new" className="btn-primary">+ New Team</Link>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">🏟️</div>
          <p>No teams yet. Add your first team to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
          {teams.map((team) => (
            <div key={team.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: team.primary_color || "#1e3a5f" }}
                >
                  {team.short_name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-sm">{team.name}</div>
                  <div className="text-xs text-gray-400">{team.short_name}</div>
                </div>
              </div>
              <Link href={`/admin/teams/${team.id}`} className="text-sm text-blue-600 hover:underline">
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
