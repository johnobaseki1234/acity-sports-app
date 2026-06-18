import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildWhatsAppPayload,
  queueWhatsAppNotification,
  type MatchEventInput,
} from "@/lib/notifications/whatsapp";

/**
 * Transactional scoring pipeline.
 * Receives a scoring-panel input, writes it to `match_events` (the DB trigger
 * recalculates the score), then queues a formatted WhatsApp payload onto the
 * `notifications` table for a downstream sender. Realtime listeners (LiveTicker)
 * pick up the new match_events row independently for instant in-app toasts.
 */
export async function POST(request: Request) {
  let body: Partial<MatchEventInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { match_id, event_type, team_id, player_id, period, match_minute } = body;
  if (!match_id || !event_type || !team_id) {
    return NextResponse.json(
      { error: "match_id, event_type and team_id are required." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: inserted, error: insertError } = await supabase
    .from("match_events")
    .insert({
      match_id,
      event_type,
      team_id,
      player_id: player_id ?? null,
      period: period ?? 1,
      match_minute: match_minute ?? null,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to log event." },
      { status: 500 }
    );
  }

  // Best-effort notification queueing — never fail the event write because of it.
  try {
    const built = await buildWhatsAppPayload(supabase, {
      match_id,
      event_type,
      team_id,
      player_id: player_id ?? null,
      period: period ?? null,
      match_minute: match_minute ?? null,
    });
    if (built) {
      await queueWhatsAppNotification(supabase, match_id, inserted.id, built.message);
    }
  } catch (err) {
    console.error("Notification queue failed:", err);
  }

  return NextResponse.json({ ok: true, event_id: inserted.id }, { status: 201 });
}
