export default function PlayerLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      {/* Profile Header Skeleton */}
      <div className="bg-gray-100 border h-40 rounded-2xl mb-8 flex items-center p-6 gap-6">
        <div className="w-28 h-28 bg-gray-200 rounded-full" />
        <div className="space-y-3 flex-1">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-50 h-24 rounded-xl border" />
        ))}
      </div>
    </div>
  );
}