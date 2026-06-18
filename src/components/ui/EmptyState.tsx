export function EmptyState({
  icon = "🏆",
  title,
  message,
}: {
  icon?: string;
  title: string;
  message?: string;
}) {
  return (
    <div className="glass rounded-3xl px-6 py-14 text-center">
      <div className="mx-auto mb-4 grid place-items-center h-20 w-20 rounded-3xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-4xl">
        {icon}
      </div>
      <p className="font-bold text-gray-800 dark:text-zinc-100">{title}</p>
      {message && <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400 max-w-xs mx-auto">{message}</p>}
    </div>
  );
}
