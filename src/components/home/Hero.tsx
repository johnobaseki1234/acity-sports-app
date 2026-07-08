import { Radio, CalendarDays, type LucideIcon } from "lucide-react";

export function Hero({
  liveCount,
  todayCount,
}: {
  liveCount: number;
  todayCount: number;
}) {
  return (
    <section className="relative overflow-hidden rounded-[32px] bg-vanguard-charcoal text-white shadow-2xl shadow-vanguard-crimson/25">
      {/* Glow / texture */}
      <div aria-hidden className="absolute inset-0">
        <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-vanguard-volt/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-40 w-40 rounded-full bg-vanguard-crimson/25 blur-3xl" />
        <div className="absolute inset-0 bg-grid opacity-15" />
      </div>

      <div className="relative px-6 py-8 sm:px-9 sm:py-11">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> Live University Sports
        </span>

        <h1 className="mt-4 text-4xl sm:text-6xl font-black tracking-tight leading-[0.95]">VANGUARD</h1>
        <p className="mt-3 max-w-md text-sm sm:text-base text-white/85 font-medium">
          Live university sports scores, fixtures and standings — all in one place.
        </p>

        <div className="mt-7 grid grid-cols-2 gap-2.5 sm:gap-4 max-w-xs">
          <Stat Icon={Radio} value={liveCount} label="Live Matches" />
          <Stat Icon={CalendarDays} value={todayCount} label="Today's Fixtures" />
        </div>
      </div>
    </section>
  );
}

function Stat({
  Icon,
  value,
  label,
}: {
  Icon: LucideIcon;
  value: number | string;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-3 py-3.5 text-center">
      <Icon className="h-5 w-5 mx-auto text-white/90" strokeWidth={2.25} />
      <div className="mt-1.5 font-black tracking-tight tabular-nums truncate text-2xl sm:text-3xl">
        {value}
      </div>
      <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-white/70 truncate">
        {label}
      </div>
    </div>
  );
}
