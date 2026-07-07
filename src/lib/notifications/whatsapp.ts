import type { SupabaseClient } from "@supabase/supabase-js";
import { formatWhatsAppMessage, type NotificationPayload } from "./formatter";

export interface MatchEventInput {
  match_id: string;
  event_type: string;
  team_id: string;
  player_id?: string | null;
  period?: number | null;
  match_minute?: number | null;
}

function one<T>(value: T | T[] | null | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : value ?? undefined;
}

const CONTEXT_SELECT = `
  home_score, away_score, current_period,
  home_team:teams!matches_home_team_id_fkey(name, short_name),
  away_team:teams!matches_away_team_id_fkey(name, short_name),
  season:seasons(name, sport:sports(slug))
`;

/**
 * Builds the formatted WhatsApp message for a just-logged event using the
 * live match context (teams, scores, sport, scoring player).
 * Returns null when the match can't be resolved.
 */
export async function buildWhatsAppPayload(
  supabase: SupabaseClient,
  input: MatchEventInput
): Promise<{ sportSlug: string; message: string } | null> {
  const { data: match } = await supabase
    .from("matches")
    .select(CONTEXT_SELECT)
    .eq("id", input.match_id)
    .single();

  if (!match) return null;

  const home = one(match.home_team as { name: string; short_name: string }[]);
  const away = one(match.away_team as { name: string; short_name: string }[]);
  const season = one(match.season as { name: string; sport: unknown }[]);
  const sport = one(season?.sport as { slug: string }[]);
  const sportSlug = sport?.slug ?? "";

  let playerName: string | undefined;
  if (input.player_id) {
    const { data: player } = await supabase
      .from("players")
      .select("name")
      .eq("id", input.player_id)
      .single();
    playerName = player?.name;
  }

  const payload: NotificationPayload = {
    leagueName: season?.name ?? "VANGUARD",
    homeTeamName: home?.short_name ?? "HOME",
    awayTeamName: away?.short_name ?? "AWAY",
    homeScore: (match.home_score as number) ?? 0,
    awayScore: (match.away_score as number) ?? 0,
    minute: input.match_minute ?? undefined,
    playerName,
    quarterNumber: input.period ?? undefined,
    setNumber: input.period ?? undefined,
  };

  return { sportSlug, message: formatWhatsAppMessage(sportSlug, input.event_type, payload) };
}

/** Pushes a formatted message onto the notifications queue for a sender worker. */
export async function queueWhatsAppNotification(
  supabase: SupabaseClient,
  matchId: string,
  eventId: string | null,
  message: string
): Promise<void> {
  await supabase.from("notifications").insert({
    match_id: matchId,
    event_id: eventId,
    channel: "whatsapp",
    payload: message,
    status: "queued",
  });
}
