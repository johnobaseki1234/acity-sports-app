export interface NotificationPayload {
  leagueName: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  minute?: number;
  playerName?: string;
  playerInName?: string;  // For substitutions
  playerOutName?: string; // For substitutions
  quarterNumber?: number; // For basketball
  setNumber?: number;     // For volleyball
  extraStats?: string;
}

export function formatWhatsAppMessage(
  sport: string,
  eventType: string,
  p: NotificationPayload
): string {
  const boundary = "-------------------------";
  const header = `🏆 *${p.leagueName}*`;
  const scoreLine = `${p.homeTeamName} *[${p.homeScore}]* - *[${p.awayScore}]* ${p.awayTeamName}`;
  const footer = `\n_Sent live from the Acity Sports Center_`;

  switch (sport) {
    case "football":
      if (eventType === "goal") {
        return `⚽ *GOAL! ${p.playerName?.toUpperCase()}* ⚽\n${boundary}\n${header}\n\n🏟️ Match: ${scoreLine}\n⏱️ Minute: ${p.minute}'\n\n_Score updated in real-time!_${footer}`;
      }
      if (eventType === "yellow_card") {
        return `🟨 *YELLOW CARD* 🟨\n${boundary}\n👤 Player: ${p.playerName}\n🏃‍♂️ Team: ${p.homeTeamName}\n⏱️ Minute: ${p.minute}'${footer}`;
      }
      if (eventType === "red_card") {
        return `🟥 *RED CARD* 🟥\n${boundary}\n👤 Player: ${p.playerName}\n🏃‍♂️ Team: ${p.homeTeamName}\n⏱️ Minute: ${p.minute}'\n\n⚠️ Team down to 10 men!${footer}`;
      }
      if (eventType === "substitution") {
        return `🔄 *SUBSTITUTION* 🔄\n${boundary}\n🟢 In: ${p.playerInName}\n🔴 Out: ${p.playerOutName}\n⏱️ Minute: ${p.minute}'${footer}`;
      }
      break;

    case "basketball":
      if (eventType === "quarter_end") {
        return `🏀 *END OF QUARTER Q${p.quarterNumber}* 🏀\n${boundary}\n${header}\n\n📊 Current Score:\n${scoreLine}\n\n🔥 *Quarter Summary:* ${p.extraStats || "Intense action on the court!"}${footer}`;
      }
      break;

    case "volleyball":
      if (eventType === "set_won") {
        return `🏐 *SET COMPLETED (Set ${p.setNumber})* 🏐\n${boundary}\n${header}\n\n✨ Set Result:\n${scoreLine}\n\n👏 What a spectacular rally!${footer}`;
      }
      break;
      
    case "match_end":
      return `🏁 *FINAL WHISTLE - MATCH OVER* 🏁\n${boundary}\n${header}\n\nFinal Scoreboard:\n${scoreLine}\n\nThank you for following the action with us!${footer}`;
  }

  // Fallback default message template structure
  return `📢 *SPORTS ALERT* 📢\n${boundary}\n${scoreLine}${footer}`;
}

// ── In-app toast formatting ───────────────────────────────────────
export interface ToastContent {
  emoji: string;
  title: string;
  body: string;
}

// Maps a raw event type to a short, friendly toast. Returns null for
// events that aren't worth interrupting the viewer for (e.g. period
// markers, missed shots), so the ticker only toasts noteworthy moments.
export function formatEventToast(
  sport: string,
  eventType: string,
  p: NotificationPayload
): ToastContent | null {
  const who = p.playerName ? ` — ${p.playerName}` : "";
  const score = `${p.homeTeamName} ${p.homeScore}–${p.awayScore} ${p.awayTeamName}`;

  switch (eventType) {
    case "goal":
    case "penalty_scored":
      return { emoji: "⚽", title: `GOAL!${who}`, body: score };
    case "points_2":
      return { emoji: "🏀", title: `2 Points${who}`, body: score };
    case "points_3":
      return { emoji: "🏀", title: `3-Pointer!${who}`, body: score };
    case "free_throw_made":
      return { emoji: "🏀", title: `Free throw${who}`, body: score };
    case "ace":
      return { emoji: "🏐", title: `Ace!${who}`, body: score };
    case "kill":
      return { emoji: "💥", title: `Kill!${who}`, body: score };
    case "block":
      return { emoji: "🛡️", title: `Block!${who}`, body: score };
    case "point":
      return { emoji: "🏐", title: "Point", body: score };
    case "yellow_card":
      return { emoji: "🟨", title: `Yellow card${who}`, body: score };
    case "red_card":
      return { emoji: "🟥", title: `Red card${who}`, body: score };
    case "match_end":
      return { emoji: "🏁", title: "Full time", body: score };
    case "quarter_end":
      return { emoji: "🏀", title: `End of Q${p.quarterNumber ?? ""}`.trim(), body: score };
    case "set_end":
      return { emoji: "🏐", title: `Set ${p.setNumber ?? ""} done`.trim(), body: score };
    default:
      return null;
  }
}

// Builds a WhatsApp share deep-link from a pre-formatted message.
export function whatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}