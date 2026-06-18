export function MatchCardSkeleton() {
  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton h-3 w-28" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex items-center justify-end gap-2.5">
          <div className="skeleton h-4 w-20" />
          <div className="skeleton h-10 w-10 rounded-2xl" />
        </div>
        <div className="skeleton h-10 w-20 rounded-xl" />
        <div className="flex items-center gap-2.5">
          <div className="skeleton h-10 w-10 rounded-2xl" />
          <div className="skeleton h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

export function MatchListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <MatchCardSkeleton key={i} />
      ))}
    </div>
  );
}
