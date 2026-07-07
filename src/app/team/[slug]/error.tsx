"use client";

import { useEffect } from "react";

export default function TeamError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Team profile route error:", error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto text-center py-16 px-4">
      <div className="bg-vanguard-crimson/10 text-vanguard-crimson w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
        !
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Failed to Load Team</h2>
      <p className="text-gray-500 text-sm mb-6">
        There was an issue fetching the roster or match statistics for this team.
      </p>
      <button
        onClick={() => reset()}
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
      >
        Try Again
      </button>
    </div>
  );
}