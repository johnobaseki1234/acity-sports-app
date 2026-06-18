export function Hero({
  liveCount,
  todayCount,
  seasonName,
}: {
  liveCount: number;
  todayCount: number;
  seasonName: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl shadow-indigo-600/25">
      {/* Glow / texture */}
      <div aria-hidden className="absolute inset-0">
        <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-40 w-40 rounded-full bg-purple-300/20 blur-3xl" />
        <div className="absolute inset-0 bg-grid opacity-20" />
      </div>

      <div className="relative px-6 py-8 sm:px-9 sm:py-11">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" /> Live University Sports
        </span>

        <h1 className="mt-4 text-4xl sm:text-6xl font-black tracking-tight leading-[0.95]">
          ACITY SPORTS
        </h1>
        <p className="mt-3 max-w-md text-sm sm:text-base text-white/80 font-medium">
          Live university sports scores, fixtures and standings — all in one place.
        </p>

        <div className="mt-7 grid grid-cols-3 gap-2.5 sm:gap-4 max-w-lg">
          <Stat icon="🔴" value={liveCount} label="Live Matches" />
          <Stat icon="📅" value={todayCount} label="Today's Fixtures" />
          <Stat icon="🏆" value={seasonName} label="Active Season" small />
        </div>
      </div>
    </section>
  );
}

function Stat({
  icon,
  value,
  label,
  small,
}: {
  icon: string;
  value: number | string;
  label: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-3 py-3.5 text-center">
      <div className="text-lg leading-none">{icon}</div>
      <div className={`mt-1.5 font-black tracking-tight tabular-nums truncate ${small ? "text-sm sm:text-base" : "text-2xl sm:text-3xl"}`}>
        {value}
      </div>
      <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-white/70 truncate">
        {label}
      </div>
    </div>
  );
}
