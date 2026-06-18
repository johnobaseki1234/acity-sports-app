export default function TeamLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      {/* Skeleton Banner */}
      <div className="bg-gray-200 h-40 rounded-2xl mb-8" />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Skeleton Sidebar */}
        <div className="bg-gray-100 h-96 rounded-xl" />
        {/* Skeleton Main Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-100 h-44 rounded-xl" />
          <div className="bg-gray-100 h-44 rounded-xl" />
        </div>
      </div>
    </div>
  );
}