"use client";

import { useState } from "react";
import { Bug, Shuffle, Timer, CheckCircle2, XCircle } from "lucide-react";
import {
  reconcileTimeline,
  verifyConvergence,
  type ReconcilableEvent,
} from "@/lib/stats/reconciliation";

type ChaosPacket = ReconcilableEvent & { label: string };

type RunResult = {
  title: string;
  pass: boolean;
  detail: string;
  timeline: ChaosPacket[];
};

/**
 * Dev-panel chaos simulator. Fires synthetic packet storms through the
 * reconciliation engine and asserts the output timeline is deterministic.
 * Purely local — never touches Supabase or the real event state.
 */
export function ChaosMonkey() {
  const [result, setResult] = useState<RunResult | null>(null);

  function injectOutOfOrder() {
    const base = Date.now();
    // Packets delivered in scrambled order with delayed local timestamps —
    // an offline device flushing its queue mid-Q3.
    const packets: ChaosPacket[] = [
      { id: "pkt-d", label: "2PT Made (delayed 90s)", client_ts: new Date(base - 90_000).toISOString(), sequence: null },
      { id: "pkt-b", label: "Foul (synced)", server_ts: new Date(base - 60_000).toISOString(), sequence: 2 },
      { id: "pkt-e", label: "3PT Made (just now)", server_ts: new Date(base).toISOString(), sequence: 5 },
      { id: "pkt-a", label: "Quarter Start (synced)", server_ts: new Date(base - 120_000).toISOString(), sequence: 1 },
      { id: "pkt-c", label: "Block (delayed 75s)", client_ts: new Date(base - 75_000).toISOString(), sequence: null },
    ];

    const timeline = reconcileTimeline(packets);
    const { converged } = verifyConvergence(packets, 8);
    const expected = ["pkt-a", "pkt-b", "pkt-c", "pkt-d", "pkt-e"];
    const ordered = timeline.map((p) => p.id).join(",") === expected.join(",");

    setResult({
      title: "Out-of-Order Packet Injection",
      pass: converged && ordered,
      detail: converged && ordered
        ? "5 scrambled packets (2 offline, 3 synced) reconciled into one stable chronological timeline across 8 shuffle trials."
        : "Timeline diverged — reconciler is NOT deterministic for this packet set.",
      timeline,
    });
  }

  function simulateRaceCondition() {
    // Two clients commit at the exact same millisecond, twice over.
    const t = new Date().toISOString();
    const packets: ChaosPacket[] = [
      { id: "client-B-shot", label: "Client B · 2PT Made", server_ts: t, sequence: null },
      { id: "client-A-shot", label: "Client A · 2PT Made", server_ts: t, sequence: null },
      { id: "client-B-foul", label: "Client B · Foul", server_ts: t, sequence: 7 },
      { id: "client-A-foul", label: "Client A · Foul", server_ts: t, sequence: 6 },
    ];

    const timeline = reconcileTimeline(packets);
    const { converged } = verifyConvergence(packets, 12);
    // Sequenced pair must respect sequence; unsequenced pair must fall back
    // to the deterministic id tie-break (A before B lexicographically).
    const ids = timeline.map((p) => p.id);
    const rulesHold =
      ids.indexOf("client-A-foul") < ids.indexOf("client-B-foul") &&
      ids.indexOf("client-A-shot") < ids.indexOf("client-B-shot");

    setResult({
      title: "Same-Split-Second Race Condition",
      pass: converged && rulesHold,
      detail: converged && rulesHold
        ? "4 packets from 2 clients at identical timestamps resolved identically across 12 shuffle trials — sequence outranks clocks, id breaks dead heats."
        : "Race resolution diverged between trials — state tearing risk.",
      timeline,
    });
  }

  return (
    <div className="rounded-2xl border border-vanguard-crimson/30 bg-vanguard-crimson/[0.04] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Bug className="h-4 w-4 text-vanguard-crimson" />
        <p className="text-xs font-black uppercase tracking-wider text-vanguard-crimson">
          Chaos Monkey · Dev Only
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={injectOutOfOrder}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2.5 text-xs font-bold text-zinc-200 transition active:scale-95"
        >
          <Shuffle className="h-3.5 w-3.5 text-vanguard-volt" />
          Inject Out-of-Order Packets
        </button>
        <button
          onClick={simulateRaceCondition}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2.5 text-xs font-bold text-zinc-200 transition active:scale-95"
        >
          <Timer className="h-3.5 w-3.5 text-vanguard-volt" />
          Simulate Race Condition
        </button>
      </div>

      {result && (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
          <div className="flex items-center gap-2">
            {result.pass ? (
              <CheckCircle2 className="h-4 w-4 text-vanguard-volt" />
            ) : (
              <XCircle className="h-4 w-4 text-vanguard-crimson" />
            )}
            <p className={`text-xs font-black uppercase tracking-wide ${result.pass ? "text-vanguard-volt" : "text-vanguard-crimson"}`}>
              {result.title} · {result.pass ? "STABLE" : "DIVERGED"}
            </p>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">{result.detail}</p>
          <ol className="space-y-1">
            {result.timeline.map((p, i) => (
              <li key={p.id} className="flex items-center gap-2 text-[11px] tabular-nums">
                <span className="grid place-items-center h-4 w-4 rounded bg-white/10 text-[9px] font-black text-zinc-400">
                  {i + 1}
                </span>
                <span className="font-semibold text-zinc-300">{p.label}</span>
                <span className="ml-auto text-zinc-600 font-mono">
                  {p.sequence != null ? `seq ${p.sequence}` : p.server_ts ? "server" : "local"}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
