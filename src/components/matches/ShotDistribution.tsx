"use client";

import { useMemo, useState } from "react";
import type { MatchEvent } from "@/lib/supabase/types";
import {
  ZONE_NAMES,
  ZONE_COUNT,
  COURT,
  buildZoneGeometry,
  hashSeed,
} from "@/lib/utils/courtZones";
import { computeZoneTelemetry, hasRealZoneData, pct } from "@/lib/utils/singleGameStats";

const VOLT = "#CCFF00";
const CRIMSON = "#E50914";

type Zone = ReturnType<typeof buildZoneGeometry>[number] & {
  pct: number;
  made: number;
  attempts: number;
};

function buildDemoZones(playerId: string): Zone[] {
  const geometry = buildZoneGeometry();
  return geometry.map((g) => {
    const h = hashSeed(`${playerId}:${g.index}`);
    const pctVal = 22 + (h % 54); // 22–75%
    const volume = Math.max(0, 4 - Math.floor(g.index / 4));
    const attempts = ((h >> 4) % (3 + volume)) + (g.index < 8 ? 1 : 0);
    const made = Math.round((attempts * pctVal) / 100);
    return { ...g, pct: pctVal, made, attempts };
  });
}

function buildRealZones(playerId: string, events: MatchEvent[]): Zone[] {
  const geometry = buildZoneGeometry();
  const tallies = computeZoneTelemetry(playerId, events);
  return geometry.map((g) => {
    const t = tallies[g.index];
    return { ...g, pct: pct(t.made, t.attempts), made: t.made, attempts: t.attempts };
  });
}

export function ShotDistribution({
  playerId,
  events,
}: {
  playerId: string;
  events: MatchEvent[];
}) {
  const [selected, setSelected] = useState<number | null>(null);

  const realZones = useMemo(() => buildRealZones(playerId, events), [playerId, events]);
  const isReal = hasRealZoneData(realZones);
  const zones = useMemo(
    () => (isReal ? realZones : buildDemoZones(playerId)),
    [isReal, realZones, playerId]
  );

  const active = selected !== null ? zones[selected] : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-300">
          14-Zone Shot Distribution
        </p>
        <span
          className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
            isReal
              ? "bg-vanguard-volt/15 text-vanguard-volt border border-vanguard-volt/30"
              : "bg-white/5 border border-white/10 text-zinc-500"
          }`}
        >
          {isReal ? "Live Telemetry" : "Demo Data"}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${COURT.width} ${COURT.height}`}
        className="block w-full mt-1"
        role="img"
        aria-label="Basketball court shot distribution across 14 zones"
      >
        <defs>
          <clipPath id="courtClip">
            <rect x="0" y="0" width={COURT.width} height={COURT.height} />
          </clipPath>
        </defs>

        <g clipPath="url(#courtClip)">
          {zones.map((z) => {
            const hasData = z.attempts > 0;
            const hot = z.pct >= 45;
            const isSel = selected === z.index;
            return (
              <path
                key={z.index}
                d={z.path}
                fill={hasData ? (hot ? VOLT : CRIMSON) : "#3f3f46"}
                fillOpacity={hasData ? 0.08 + (z.pct / 100) * 0.42 : 0.06}
                stroke={isSel ? VOLT : "#ffffff"}
                strokeOpacity={isSel ? 0.9 : 0.12}
                strokeWidth={isSel ? 2 : 1}
                className="cursor-pointer transition-all"
                onClick={() => setSelected(isSel ? null : z.index)}
              />
            );
          })}

          {/* Court markings */}
          <g pointerEvents="none" stroke="#ffffff" strokeOpacity="0.25" fill="none">
            <rect x="1" y="1" width={COURT.width - 2} height={COURT.height - 2} strokeWidth="2" />
            <rect x="175" y="0" width="150" height="175" strokeWidth="1.5" />
            <circle cx={COURT.cx} cy="175" r="55" strokeWidth="1.5" />
            <path d={`M 30 0 L 30 90 A 220 220 0 0 0 470 90 L 470 0`} strokeWidth="1.5" />
            <line x1="220" y1="24" x2="280" y2="24" strokeWidth="2.5" strokeOpacity="0.5" />
            <circle cx={COURT.cx} cy={COURT.cy} r="9" strokeWidth="2" strokeOpacity="0.5" />
          </g>

          <g pointerEvents="none">
            {zones.map((z) => (
              <text
                key={z.index}
                x={z.labelX}
                y={z.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="13"
                fontWeight="800"
                fill="#ffffff"
                fillOpacity={
                  z.attempts === 0 ? 0.25 : selected === null || selected === z.index ? 0.85 : 0.3
                }
              >
                {z.attempts > 0 || !isReal ? `${z.pct}%` : "—"}
              </text>
            ))}
          </g>
        </g>
      </svg>

      <div className="px-4 pb-4 pt-2">
        {active ? (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{active.name}</p>
              <p className="text-[11px] text-zinc-400 tabular-nums">
                {active.made}/{active.attempts} FG
              </p>
            </div>
            <span
              className="text-xl font-black tabular-nums"
              style={{ color: active.attempts === 0 ? "#71717a" : active.pct >= 45 ? VOLT : CRIMSON }}
            >
              {active.attempts > 0 ? `${active.pct}%` : "—"}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm" style={{ background: CRIMSON }} /> Cold
            </span>
            <span>{isReal ? "Tap a zone for detail" : "No live shots logged yet"}</span>
            <span className="inline-flex items-center gap-1.5">
              Hot <span className="h-2 w-2 rounded-sm" style={{ background: VOLT }} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export { ZONE_NAMES };
