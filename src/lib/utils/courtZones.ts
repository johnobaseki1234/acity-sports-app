/**
 * Shared 14-zone half-court geometry, hoop-centric:
 *   band 0 (r<55):      1 — restricted area
 *   band 1 (55–130):    3 sectors — low posts + middle paint
 *   band 2 (130–215):   4 sectors — mid-range
 *   band 3 (215–305):   5 sectors — three-point belt
 *   band 4 (r>305):     1 — deep range
 *
 * Used by both the scorer's shot-location capture UI and the public
 * ShotDistribution display so a tap in one maps to the same zone index
 * everywhere.
 */

export const ZONE_NAMES = [
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
] as const;

export const ZONE_COUNT = ZONE_NAMES.length;

export const COURT = { cx: 250, cy: 42, width: 500, height: 400 };

export const ZONE_BANDS: { r0: number; r1: number; count: number }[] = [
  { r0: 0, r1: 55, count: 1 },
  { r0: 55, r1: 130, count: 3 },
  { r0: 130, r1: 215, count: 4 },
  { r0: 215, r1: 305, count: 5 },
  { r0: 305, r1: 620, count: 1 },
];

export function polar(r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [COURT.cx + r * Math.cos(rad), COURT.cy + r * Math.sin(rad)];
}

/** Annular sector below the hoop; angles in degrees, 0 = right sideline, 180 = left. */
export function sectorPath(r0: number, r1: number, a0: number, a1: number): string {
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

export type ZoneGeometry = {
  index: number;
  name: string;
  path: string;
  labelX: number;
  labelY: number;
};

export function buildZoneGeometry(maxY = COURT.height - 14): ZoneGeometry[] {
  const zones: ZoneGeometry[] = [];
  let index = 0;
  for (const { r0, r1, count } of ZONE_BANDS) {
    const span = 180 / count;
    for (let s = 0; s < count; s++) {
      const a0 = s * span;
      const a1 = (s + 1) * span;
      const midR = index === ZONE_COUNT - 1 ? 340 : (r0 + r1) / 2;
      const [labelX, labelY] = polar(midR, (a0 + a1) / 2);
      zones.push({
        index,
        name: ZONE_NAMES[index],
        path: sectorPath(r0, r1, a0, a1),
        labelX,
        labelY: Math.min(labelY, maxY),
      });
      index++;
    }
  }
  return zones;
}

/** Deterministic hash used only to seed demo data before any real shots exist. */
export function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}
