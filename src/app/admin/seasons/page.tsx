import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Season } from "@/lib/supabase/types";

export default async function SeasonsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("seasons")
    .select("*, sport:sports(*)")
    .order("created_at", { ascending: false });
  const seasons = (data ?? []) as Season[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Seasons & Leagues</h1>
        <Link href="/admin/seasons/new" className="btn-primary">+ New Season</Link>
      </div>

      {seasons.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">📅</div>
          <p>No seasons yet. Create one to start scheduling matches.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
          {seasons.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-medium text-sm flex items-center gap-2">
                  {s.sport?.icon} {s.name}
                  {s.is_active && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(s.start_date).toLocaleDateString()} – {new Date(s.end_date).toLocaleDateString()}
                </div>
              </div>
              <Link href={`/admin/seasons/${s.id}`} className="text-sm text-blue-600 hover:underline">
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
