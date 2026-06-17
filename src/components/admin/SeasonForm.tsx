"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Season, Sport } from "@/lib/supabase/types";

export function SeasonForm({ season, sports }: { season?: Season; sports: Sport[] }) {
  const router = useRouter();
  const isEdit = !!season;

  const [form, setForm] = useState({
    sport_id: season?.sport_id ?? sports[0]?.id ?? "",
    name: season?.name ?? "",
    start_date: season?.start_date ?? "",
    end_date: season?.end_date ?? "",
    is_active: season?.is_active ?? false,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function standingsConfigForSport(sportId: string) {
    const sport = sports.find((s) => s.id === sportId);
    if (sport?.slug === "basketball") {
      return { points_win: 2, points_draw: 0, points_loss: 0 };
    }
    return { points_win: 3, points_draw: 1, points_loss: 0 };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const supabase = createClient();

    const payload = {
      ...form,
      standings_config: standingsConfigForSport(form.sport_id),
    };

    const { error } = isEdit
      ? await supabase.from("seasons").update(payload).eq("id", season.id)
      : await supabase.from("seasons").insert(payload);

    if (error) { setError(error.message); setSaving(false); return; }
    router.push("/admin/seasons");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl border border-gray-100 p-6">
      <div>
        <label className="label">Sport</label>
        <select className="input" value={form.sport_id} onChange={(e) => set("sport_id", e.target.value)} required>
          {sports.map((s) => (
            <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Season Name</label>
        <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Inter-Hall Football 2026" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Start Date</label>
          <input type="date" className="input" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} required />
        </div>
        <div>
          <label className="label">End Date</label>
          <input type="date" className="input" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} required />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} className="w-4 h-4 rounded" />
        <span className="text-sm font-medium text-gray-700">Mark as active season</span>
      </label>

      {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Season"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}
