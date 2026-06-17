"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Team } from "@/lib/supabase/types";

export function TeamForm({ team }: { team?: Team }) {
  const router = useRouter();
  const isEdit = !!team;

  const [form, setForm] = useState({
    name: team?.name ?? "",
    short_name: team?.short_name ?? "",
    slug: team?.slug ?? "",
    primary_color: team?.primary_color ?? "#1e3a5f",
    secondary_color: team?.secondary_color ?? "#ffffff",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(field: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "name" && !isEdit) {
        next.slug = value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        if (!next.short_name) next.short_name = value.split(" ").slice(-1)[0].slice(0, 8);
      }
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const supabase = createClient();

    const payload = { ...form };
    const { error } = isEdit
      ? await supabase.from("teams").update(payload).eq("id", team.id)
      : await supabase.from("teams").insert(payload);

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }
    router.push("/admin/teams");
    router.refresh();
  }

  async function handleDelete() {
    if (!team || !confirm(`Delete ${team.name}? This cannot be undone.`)) return;
    const supabase = createClient();
    await supabase.from("teams").delete().eq("id", team.id);
    router.push("/admin/teams");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl border border-gray-100 p-6">
      <div>
        <label className="label">Team Name</label>
        <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required />
      </div>
      <div>
        <label className="label">Short Name <span className="text-gray-400 font-normal">(shown on scoreboards)</span></label>
        <input className="input" value={form.short_name} onChange={(e) => set("short_name", e.target.value)} maxLength={10} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Primary Color</label>
          <div className="flex gap-2">
            <input type="color" className="h-9 w-12 rounded border border-gray-200 cursor-pointer" value={form.primary_color} onChange={(e) => set("primary_color", e.target.value)} />
            <input className="input" value={form.primary_color} onChange={(e) => set("primary_color", e.target.value)} pattern="#[0-9a-fA-F]{6}" />
          </div>
        </div>
        <div>
          <label className="label">Secondary Color</label>
          <div className="flex gap-2">
            <input type="color" className="h-9 w-12 rounded border border-gray-200 cursor-pointer" value={form.secondary_color} onChange={(e) => set("secondary_color", e.target.value)} />
            <input className="input" value={form.secondary_color} onChange={(e) => set("secondary_color", e.target.value)} pattern="#[0-9a-fA-F]{6}" />
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Team"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-ghost">
          Cancel
        </button>
        {isEdit && (
          <button type="button" onClick={handleDelete} className="btn-danger ml-auto">
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
