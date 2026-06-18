"use client";

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
    <div className="glass rounded-3xl px-6 py-14 text-center max-w-md mx-auto">
      <div className="mx-auto mb-4 grid place-items-center h-20 w-20 rounded-3xl bg-gradient-to-br from-red-500/15 to-orange-500/15 text-4xl">
        ⚠️
      </div>
      <p className="font-bold text-gray-800 dark:text-zinc-100">{title}</p>
      <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 shadow-lg shadow-blue-600/20 transition active:scale-95"
        >
          ↻ Try again
        </button>
      )}
    </div>
  );
}
