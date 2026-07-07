"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Sport, School } from "@/lib/supabase/types";

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** Provisions a new School into the network — grows the onboarding pool. */
export function NewSchoolForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#CCFF00");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const supabase = createClient();

    const { error } = await supabase.from("schools").insert({
      name,
      short_name: shortName || name.slice(0, 3).toUpperCase(),
      slug: slugify(name),
      primary_color: primaryColor,
    });

    if (error) { setError(error.message); setSaving(false); return; }
    setName("");
    setShortName("");
    router.refresh();
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
      <h3 className="font-bold text-zinc-900 dark:text-white">New School</h3>
      <div>
        <label className="label">School Name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ashesi University" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Short Code</label>
          <input className="input" value={shortName} onChange={(e) => setShortName(e.target.value.toUpperCase())} placeholder="e.g. ASH" maxLength={4} />
        </div>
        <div>
          <label className="label">Brand Color</label>
          <input type="color" className="input h-11 p-1" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
        </div>
      </div>
      {error && <div className="text-sm text-vanguard-crimson bg-vanguard-crimson/10 rounded-lg px-3 py-2">{error}</div>}
      <button type="submit" disabled={saving || !name} className="btn-primary disabled:opacity-50">
        {saving ? "Provisioning…" : "Add School"}
      </button>
    </form>
  );
}

/** Provisions a new League (an active Season row under a school + sport). */
export function NewLeagueForm({ schools, sports }: { schools: School[]; sports: Sport[] }) {
  const router = useRouter();
  const [schoolId, setSchoolId] = useState(schools[0]?.id ?? "");
  const [sportId, setSportId] = useState(sports[0]?.id ?? "");
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function standingsConfigForSport(id: string) {
    const sport = sports.find((s) => s.id === id);
    if (sport?.slug === "basketball") return { points_win: 2, points_draw: 0, points_loss: 0 };
    return { points_win: 3, points_draw: 1, points_loss: 0 };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const supabase = createClient();

    const { error } = await supabase.from("seasons").insert({
      school_id: schoolId,
      sport_id: sportId,
      name,
      start_date: startDate,
      end_date: endDate,
      is_active: isActive,
      standings_config: standingsConfigForSport(sportId),
    });

    if (error) { setError(error.message); setSaving(false); return; }
    setName("");
    setStartDate("");
    setEndDate("");
    router.refresh();
    setSaving(false);
  }

  if (schools.length === 0) {
    return (
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 text-sm text-zinc-500">
        Add a school first before provisioning a league under it.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
      <h3 className="font-bold text-zinc-900 dark:text-white">New League / Season</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">School</label>
          <select className="input" value={schoolId} onChange={(e) => setSchoolId(e.target.value)} required>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Sport</label>
          <select className="input" value={sportId} onChange={(e) => setSportId(e.target.value)} required>
            {sports.map((s) => (
              <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">League Name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. AFL Season 1" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Start Date</label>
          <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </div>
        <div>
          <label className="label">End Date</label>
          <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 rounded" />
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Mark as active season (feeds the onboarding pool immediately)</span>
      </label>

      {error && <div className="text-sm text-vanguard-crimson bg-vanguard-crimson/10 rounded-lg px-3 py-2">{error}</div>}

      <button type="submit" disabled={saving || !name} className="btn-primary disabled:opacity-50">
        {saving ? "Provisioning…" : "Create League"}
      </button>
    </form>
  );
}
