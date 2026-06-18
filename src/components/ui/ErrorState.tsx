"use client";

import { AlertTriangle, RotateCw } from "lucide-react";

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this right now. Please try again.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl px-6 py-14 text-center max-w-md mx-auto shadow-lg">
      <div className="mx-auto mb-4 grid place-items-center h-20 w-20 rounded-3xl bg-gradient-to-br from-red-500/15 to-red-700/15 text-red-600 dark:text-red-500">
        <AlertTriangle className="h-9 w-9" strokeWidth={1.75} />
      </div>
      <p className="font-bold text-zinc-800 dark:text-zinc-100">{title}</p>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-5 shadow-lg shadow-red-600/20 transition-all duration-300 active:scale-95"
        >
          <RotateCw className="h-4 w-4" /> Try again
        </button>
      )}
    </div>
  );
}
