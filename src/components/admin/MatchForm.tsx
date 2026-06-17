"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Match, Season, Team } from "@/lib/supabase/types";

export function MatchForm({
  match,
  seasons,
  teams,
}: {
  match?: Match;
  seasons: Season[];
  teams: Team[];
}) {
  const router = useRouter();
  const isEdit = !!match;

  const [form, setForm] = useState({
    season_id: match?.season_id ?? seasons[0]?.id ?? "",
    home_team_id: match?.home_team_id ?? "",
    away_team_id: match?.away_team_id ?? "",
    venue: match?.venue ?? "",
    scheduled_at: match?.scheduled_at
      ? new Date(match.scheduled_at).toISOString().slice(0, 16)
      : "",
    matchday: String(match?.matchday ?? ""),
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.home_team_id === form.away_team_id) {
      setError("Home and away teams must be different.");
      return;
    }
    setSaving(true);
    setError("");
    const supabase = createClient();

    const payload = {
      season_id: form.season_id,
      home_team_id: form.home_team_id,
      away_team_id: form.away_team_id,
      venue: form.venue,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      matchday: form.matchday ? parseInt(form.matchday) : null,
      status: match?.status ?? "scheduled",
    };

    const { error } = isEdit
      ? await supabase.from("matches").update(payload).eq("id", match.id)
      : await supabase.from("matches").insert(payload);

    if (error) { setError(error.message); setSaving(false); return; }
    router.push("/admin/matches");
    router.refresh();
  }

  async function handleDelete() {
    if (!match || !confirm("Delete this match? This cannot be undone.")) return;
    const supabase = createClient();
    await supabase.from("matches").delete().eq("id", match.id);
    router.push("/admin/matches");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl border border-gray-100 p-6">
      <div>
        <label className="label">Season / League</label>
        <select className="input" value={form.season_id} onChange={(e) => set("season_id", e.target.value)} required>
          <option value="">Select season…</option>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>{s.sport?.icon} {s.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Home Team</label>
          <select className="input" value={form.home_team_id} onChange={(e) => set("home_team_id", e.target.value)} required>
            <option value="">Select…</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Away Team</label>
          <select className="input" value={form.away_team_id} onChange={(e) => set("away_team_id", e.target.value)} required>
            <option value="">Select…</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Date & Time</label>
        <input type="datetime-local" className="input" value={form.scheduled_at} onChange={(e) => set("scheduled_at", e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Venue</label>
          <input className="input" value={form.venue} onChange={(e) => set("venue", e.target.value)} placeholder="e.g. Main Pitch" required />
        </div>
        <div>
          <label className="label">Matchday (optional)</label>
          <input type="number" className="input" value={form.matchday} onChange={(e) => set("matchday", e.target.value)} min={1} placeholder="1" />
        </div>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Schedule Match"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-ghost">Cancel</button>
        {isEdit && match?.status === "scheduled" && (
          <button type="button" onClick={handleDelete} className="btn-danger ml-auto">Delete</button>
        )}
      </div>
    </form>
  );
}
