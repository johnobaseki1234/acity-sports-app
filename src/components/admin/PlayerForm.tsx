"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Player, Team } from "@/lib/supabase/types";

const SPORT_POSITIONS: Record<string, string[]> = {
  football: ["GK", "CB", "LB", "RB", "CM", "DM", "AM", "LW", "RW", "ST"],
  basketball: ["PG", "SG", "SF", "PF", "C"],
  volleyball: ["S", "OH", "OPP", "MB", "L", "DS"],
};

const SPORT_ICONS: Record<string, string> = {
  football: "⚽",
  basketball: "🏀",
  volleyball: "🏐",
};

type Sport = { id: string; name: string; slug: string };

interface Props {
  player?: Player;
  teams: Team[];
  sports: Sport[];
  teamSportMap: Record<string, string>; // team_id → sport_slug
}

export function PlayerForm({ player, teams, sports, teamSportMap }: Props) {
  const router = useRouter();
  const isEdit = !!player;

  // For edit mode, derive which sport this team belongs to
  const editSportSlug = player ? teamSportMap[player.team_id] ?? "" : "";

  const [step, setStep] = useState(isEdit ? 3 : 1);
  const [selectedSport, setSelectedSport] = useState<string>(editSportSlug);
  const [form, setForm] = useState({
    team_id: player?.team_id ?? "",
    name: player?.name ?? "",
    jersey_number: String(player?.jersey_number ?? ""),
    position: player?.position ?? "",
    secondary_position: player?.secondary_position ?? "",
    is_active: player?.is_active ?? true,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const teamsForSport = teams.filter((t) => teamSportMap[t.id] === selectedSport);
  const positions = SPORT_POSITIONS[selectedSport] ?? [];

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const supabase = createClient();

    const payload = {
      team_id: form.team_id,
      name: form.name,
      jersey_number: parseInt(form.jersey_number),
      position: form.position || null,
      secondary_position: form.secondary_position || null,
      is_active: form.is_active,
    };

    const { error } = isEdit
      ? await supabase.from("players").update(payload).eq("id", player.id)
      : await supabase.from("players").insert(payload);

    if (error) { setError(error.message); setSaving(false); return; }
    router.push("/admin/players");
    router.refresh();
  }

  // ── EDIT MODE: skip wizard, show full form ──
  if (isEdit) {
    const editTeam = teams.find((t) => t.id === form.team_id);
    return (
      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-2">
          <div className="w-8 h-8 rounded-full" style={{ background: editTeam?.primary_color ?? "#ccc" }} />
          <div>
            <p className="font-semibold text-sm">{editTeam?.name}</p>
            <p className="text-xs text-gray-500">{editSportSlug}</p>
          </div>
        </div>
        <div>
          <label className="label">Full Name</label>
          <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Jersey Number</label>
            <input type="number" className="input" value={form.jersey_number} onChange={(e) => set("jersey_number", e.target.value)} min={0} max={99} required />
          </div>
          <div>
            <label className="label">Position</label>
            <input className="input" list="positions-edit" value={form.position} onChange={(e) => set("position", e.target.value)} />
            <datalist id="positions-edit">{positions.map((p) => <option key={p} value={p} />)}</datalist>
          </div>
        </div>
        <div>
          <label className="label">Secondary Position <span className="text-gray-400 font-normal">(optional)</span></label>
          <input className="input" list="positions-edit-sec" value={form.secondary_position} onChange={(e) => set("secondary_position", e.target.value)} placeholder="e.g. PG" />
          <datalist id="positions-edit-sec">{positions.map((p) => <option key={p} value={p} />)}</datalist>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} className="w-4 h-4 rounded" />
          <span className="text-sm font-medium text-gray-700">Active player</span>
        </label>
        {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-ghost">Cancel</button>
        </div>
      </form>
    );
  }

  // ── CREATE MODE: step wizard ──
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Step indicator */}
      <div className="flex border-b border-gray-100">
        {["League", "Team", "Details"].map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const active = step === n;
          return (
            <div key={n} className={`flex-1 flex items-center gap-2 px-4 py-3 text-sm font-medium ${active ? "text-brand-blue bg-blue-50" : done ? "text-green-600" : "text-gray-400"}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${active ? "bg-brand-blue text-white" : done ? "bg-green-100 text-green-700" : "bg-gray-100"}`}>
                {done ? "✓" : n}
              </span>
              {label}
            </div>
          );
        })}
      </div>

      <div className="p-6">
        {/* Step 1: Select sport/league */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="font-semibold text-gray-700 mb-4">Which league is this player in?</p>
            {sports.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => { setSelectedSport(s.slug); setForm((f) => ({ ...f, team_id: "" })); setStep(2); }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-brand-blue hover:bg-blue-50 transition-all text-left"
              >
                <span className="text-3xl">{SPORT_ICONS[s.slug] ?? "🏆"}</span>
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-sm text-gray-500">{teamsForSport.length} teams</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Select team */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <button type="button" onClick={() => setStep(1)} className="text-sm text-gray-400 hover:text-gray-600">← Back</button>
              <p className="font-semibold text-gray-700">Which team?</p>
            </div>
            {teamsForSport.length === 0 ? (
              <p className="text-gray-400 text-sm">No teams added for this sport yet. <a href="/admin/teams/new" className="text-brand-blue underline">Add a team first.</a></p>
            ) : (
              teamsForSport.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { set("team_id", t.id); setStep(3); }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-brand-blue hover:bg-blue-50 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-white shadow flex-shrink-0" style={{ background: t.primary_color }} />
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{t.short_name}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Step 3: Player details */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <button type="button" onClick={() => setStep(2)} className="text-sm text-gray-400 hover:text-gray-600">← Back</button>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full" style={{ background: teams.find((t) => t.id === form.team_id)?.primary_color ?? "#ccc" }} />
                <p className="font-semibold text-gray-700">{teams.find((t) => t.id === form.team_id)?.name}</p>
              </div>
            </div>
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Jersey Number</label>
                <input type="number" className="input" value={form.jersey_number} onChange={(e) => set("jersey_number", e.target.value)} min={0} max={99} required />
              </div>
              <div>
                <label className="label">Position</label>
                <input className="input" list="positions-create" value={form.position} onChange={(e) => set("position", e.target.value)} placeholder={positions[0] ?? "e.g. PG"} />
                <datalist id="positions-create">{positions.map((p) => <option key={p} value={p} />)}</datalist>
              </div>
            </div>
            <div>
              <label className="label">Secondary Position <span className="text-gray-400 font-normal">(optional)</span></label>
              <input className="input" list="positions-create-sec" value={form.secondary_position} onChange={(e) => set("secondary_position", e.target.value)} placeholder="e.g. SG" />
              <datalist id="positions-create-sec">{positions.map((p) => <option key={p} value={p} />)}</datalist>
            </div>
            {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? "Saving…" : "Add Player"}
              </button>
              <button type="button" onClick={() => router.back()} className="btn-ghost">Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
