import type { MatchStatus } from "@/lib/supabase/types";

export function formatMatchTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export function formatMatchDate(isoString: string): string {
  const date = new Date(isoString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString("en-GH", { weekday: "short", month: "short", day: "numeric" });
}

export function getStatusLabel(status: MatchStatus): string {
  const labels: Record<MatchStatus, string> = {
    scheduled: "Upcoming",
    live: "Live",
    halftime: "Half-time",
    finished: "Full-time",
    postponed: "Postponed",
    cancelled: "Cancelled",
  };
  return labels[status];
}

export function sportIcon(slug: string): string {
  return { football: "⚽", basketball: "🏀", volleyball: "🏐" }[slug] ?? "🏆";
}
