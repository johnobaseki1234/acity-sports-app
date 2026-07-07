"use client";

import { COURT, buildZoneGeometry, ZONE_NAMES } from "@/lib/utils/courtZones";

/** Compact tap-to-log shot-location picker shown during shot resolution. */
export function ZonePicker({
  onSelect,
  onSkip,
}: {
  onSelect: (zoneIndex: number) => void;
  onSkip: () => void;
}) {
  const zones = buildZoneGeometry();

  return (
    <div className="bg-zinc-900 border-2 border-vanguard-volt/40 rounded-2xl p-4 text-center">
      <p className="text-sm text-zinc-300 font-semibold uppercase tracking-wider mb-3">
        Tap the shot location
      </p>
      <svg
        viewBox={`0 0 ${COURT.width} ${COURT.height}`}
        className="w-full max-w-xs mx-auto"
        role="img"
        aria-label="Tap a court zone to log this shot's location"
      >
        {zones.map((z) => (
          <path
            key={z.index}
            d={z.path}
            fill="#CCFF00"
            fillOpacity={0.08}
            stroke="#ffffff"
            strokeOpacity={0.15}
            strokeWidth={1}
            className="cursor-pointer active:fill-opacity-40 transition-all"
            onClick={() => onSelect(z.index)}
          >
            <title>{ZONE_NAMES[z.index]}</title>
          </path>
        ))}
        <g pointerEvents="none" stroke="#ffffff" strokeOpacity="0.2" fill="none">
          <rect x="1" y="1" width={COURT.width - 2} height={COURT.height - 2} strokeWidth="2" />
          <rect x="175" y="0" width="150" height="175" strokeWidth="1.5" />
          <circle cx={COURT.cx} cy="175" r="55" strokeWidth="1.5" />
          <circle cx={COURT.cx} cy={COURT.cy} r="9" strokeWidth="2" />
        </g>
      </svg>
      <button
        onClick={onSkip}
        className="text-xs text-zinc-500 hover:text-zinc-300 underline mt-3 block mx-auto"
      >
        Skip location
      </button>
    </div>
  );
}
