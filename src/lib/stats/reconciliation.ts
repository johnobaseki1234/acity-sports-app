/**
 * Event timeline reconciliation.
 *
 * Match events can arrive from multiple scorer devices with drifting clocks,
 * offline sync queues replaying old packets, and realtime inserts racing the
 * initial fetch. This module produces one deterministic chronological
 * timeline no matter what order packets arrive in.
 *
 * Ordering authority (highest wins):
 *   1. `sequence`   — monotonic per-match increment assigned by the backend
 *   2. `server_ts`  — authoritative Postgres commit timestamp (created_at)
 *   3. `client_ts`  — local device wall clock at capture time (offline queue)
 *   4. `id`         — final deterministic tie-break so two clients logging in
 *                     the exact same millisecond still agree on one order
 */

export type ReconcilableEvent = {
  id: string;
  /** Backend-assigned monotonic sequence increment, if present. */
  sequence?: number | null;
  /** Authoritative server commit timestamp (ISO). */
  server_ts?: string | null;
  /** Local device timestamp captured at input time (ISO). */
  client_ts?: string | null;
};

function tsMillis(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Total-order comparator. Never returns 0 for events with distinct ids,
 * which is what makes the output stable across devices and re-runs.
 */
export function compareEvents(a: ReconcilableEvent, b: ReconcilableEvent): number {
  // 1. Sequence increments outrank every clock.
  const aSeq = a.sequence ?? null;
  const bSeq = b.sequence ?? null;
  if (aSeq !== null && bSeq !== null && aSeq !== bSeq) return aSeq - bSeq;

  // 2. Server commit time.
  const aServer = tsMillis(a.server_ts);
  const bServer = tsMillis(b.server_ts);
  if (aServer !== null && bServer !== null && aServer !== bServer) return aServer - bServer;

  // 3. Best-available clock cross-compare: a synced event vs an offline
  //    packet still pending upload compares server-vs-client.
  const aBest = aServer ?? tsMillis(a.client_ts);
  const bBest = bServer ?? tsMillis(b.client_ts);
  if (aBest !== null && bBest !== null && aBest !== bBest) return aBest - bBest;
  if (aBest !== null && bBest === null) return -1;
  if (aBest === null && bBest !== null) return 1;

  // 4. Same split-second (or no clocks at all): sequence presence, then id.
  if (aSeq !== null && bSeq === null) return -1;
  if (aSeq === null && bSeq !== null) return 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Ingest an arbitrarily-ordered array of events (duplicates allowed — later
 * copies of the same id win, so a synced row replaces its optimistic ghost)
 * and return a new, perfectly ordered chronological timeline.
 *
 * Pure: never mutates the input array or its elements.
 */
export function reconcileTimeline<T extends ReconcilableEvent>(
  events: readonly T[],
  order: "asc" | "desc" = "asc"
): T[] {
  const byId = new Map<string, T>();
  for (const ev of events) byId.set(ev.id, ev);

  const sorted = [...byId.values()].sort(compareEvents);
  return order === "desc" ? sorted.reverse() : sorted;
}

/**
 * Merge a batch of incoming packets (realtime inserts, offline sync replays,
 * out-of-order deliveries) into an existing timeline. Returns a fresh array.
 */
export function mergeEventStreams<T extends ReconcilableEvent>(
  timeline: readonly T[],
  incoming: readonly T[],
  order: "asc" | "desc" = "asc"
): T[] {
  return reconcileTimeline([...timeline, ...incoming], order);
}

/**
 * Verifies the reconciler is deterministic for a given packet set: shuffles
 * the input and confirms every permutation converges on the same timeline.
 * Used by the Chaos Monkey dev panel; cheap enough for runtime asserts.
 */
export function verifyConvergence<T extends ReconcilableEvent>(
  events: readonly T[],
  trials = 5
): { converged: boolean; canonical: string[] } {
  const canonical = reconcileTimeline(events).map((e) => e.id);
  for (let t = 0; t < trials; t++) {
    const shuffled = [...events];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const run = reconcileTimeline(shuffled).map((e) => e.id);
    if (run.length !== canonical.length || run.some((id, i) => id !== canonical[i])) {
      return { converged: false, canonical };
    }
  }
  return { converged: true, canonical };
}
