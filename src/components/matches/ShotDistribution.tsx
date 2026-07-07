"use client";

import { useMemo, useState } from "react";

const VOLT = "#CCFF00";
const CRIMSON = "#E50914";

/**
 * 14 tactical zones, hoop-centric:
 *   band 0 (r<55):      1 — restricted area
 *   band 1 (55–130):    3 sectors — low posts + middle paint
 *   band 2 (130–215):   4 sectors — mid-range
 *   band 3 (215–305):   5 sectors — three-point belt
 *   band 4 (r>305):     1 — deep range
 */
const ZONE_NAMES = [
  "Restricted Area",
  "Right Low Post",
  "Middle Paint",
  "Left Low Post",
  "Right Baseline Mid",
  "Right Elbow",
  "Left Elbow",
  "Left Baseline Mid",
  "Right Corner 3",
  "Right Wing 3",
  "Top of Arc 3",
  "Left Wing 3",
  "Left Corner 3",
  "Deep Range",
];

type Zone = {
  index: number;
  name: string;
  path: string;
  labelX: number;
  labelY: number;
  pct: number;
  made: number;
  attempts: number;
};

const CX = 250;
const CY = 42;
const W = 500;
const H = 400;

function polar(r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

/** Annular sector below the hoop; angles in degrees, 0 = right sideline, 180 = left. */
function sectorPath(r0: number, r1: number, a0: number, a1: number): string {
  const [x0, y0] = polar(r0, a0);
  const [x1, y1] = polar(r1, a0);
  const [x2, y2] = polar(r1, a1);
  const [x3, y3] = polar(r0, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return [
    `M ${x0} ${y0}`,
    `L ${x1} ${y1}`,
    `A ${r1} ${r1} 0 ${large} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${r0} ${r0} 0 ${large} 0 ${x0} ${y0}`,
    "Z",
  ].join(" ");
}

/** Deterministic hash so mock zone data is stable per player across renders. */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function buildZones(playerId: string, gameScore: number): Zone[] {
  const bands: { r0: number; r1: number; count: number }[] = [
    { r0: 0, r1: 55, count: 1 },
    { r0: 55, r1: 130, count: 3 },
    { r0: 130, r1: 215, count: 4 },
    { r0: 215, r1: 305, count: 5 },
    { r0: 305, r1: 620, count: 1 },
  ];

  const zones: Zone[] = [];
  let index = 0;
  for (const { r0, r1, count } of bands) {
    const span = 180 / count;
    for (let s = 0; s < count; s++) {
      const a0 = s * span;
      const a1 = (s + 1) * span;
      const h = hash(`${playerId}:${index}`);
      const pct = 22 + (h % 54); // 22–75%
      // Higher-scoring games surface more attempts; rim zones shoot more than deep ones.
      const volume = Math.max(0, 4 - Math.floor(index / 4));
      const attempts = ((h >> 4) % (3 + volume)) + (gameScore > 0 && index < 8 ? 1 : 0);
      const made = Math.round((attempts * pct) / 100);
      const midR = index === 13 ? 340 : (r0 + r1) / 2;
      const [labelX, labelY] = polar(midR, (a0 + a1) / 2);
      zones.push({
        index,
        name: ZONE_NAMES[index],
        path: sectorPath(r0, r1, a0, a1),
        labelX,
        labelY: Math.min(labelY, H - 14),
        pct,
        made,
        attempts,
      });
      index++;
    }
  }
  return zones;
}

export function ShotDistribution({
  playerId,
  gameScore,
}: {
  playerId: string;
  gameScore: number;
}) {
  const zones = useMemo(() => buildZones(playerId, gameScore), [playerId, gameScore]);
  const [selected, setSelected] = useState<number | null>(null);
  const active = selected !== null ? zones[selected] : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-300">
          14-Zone Shot Distribution
        </p>
        <span className="rounded-md bg-white/5 border border-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
          Demo Data
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full mt-1"
        role="img"
        aria-label="Basketball court shot distribution across 14 zones"
      >
        <defs>
          <clipPath id="courtClip">
            <rect x="0" y="0" width={W} height={H} rx="0" />
          </clipPath>
        </defs>

        <g clipPath="url(#courtClip)">
          {zones.map((z) => {
            const hot = z.pct >= 45;
            const isSel = selected === z.index;
            return (
              <path
                key={z.index}
                d={z.path}
                fill={hot ? VOLT : CRIMSON}
                fillOpacity={0.08 + (z.pct / 100) * 0.42}
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
            {/* Baseline + sidelines */}
            <rect x="1" y="1" width={W - 2} height={H - 2} strokeWidth="2" />
            {/* Paint */}
            <rect x="175" y="0" width="150" height="175" strokeWidth="1.5" />
            {/* Free-throw circle */}
            <circle cx={CX} cy="175" r="55" strokeWidth="1.5" />
            {/* Three-point arc */}
            <path d={`M 30 0 L 30 90 A 220 220 0 0 0 470 90 L 470 0`} strokeWidth="1.5" />
            {/* Backboard + rim */}
            <line x1="220" y1="24" x2="280" y2="24" strokeWidth="2.5" strokeOpacity="0.5" />
            <circle cx={CX} cy={CY} r="9" strokeWidth="2" strokeOpacity="0.5" />
          </g>

          {/* Zone percentages */}
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
                fillOpacity={selected === null || selected === z.index ? 0.85 : 0.3}
              >
                {z.pct}%
              </text>
            ))}
          </g>
        </g>
      </svg>

      {/* Zone readout */}
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
              style={{ color: active.pct >= 45 ? VOLT : CRIMSON }}
            >
              {active.pct}%
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm" style={{ background: CRIMSON }} /> Cold
            </span>
            <span>Tap a zone for detail</span>
            <span className="inline-flex items-center gap-1.5">
              Hot <span className="h-2 w-2 rounded-sm" style={{ background: VOLT }} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
