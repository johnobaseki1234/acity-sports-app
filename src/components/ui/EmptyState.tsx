import { CalendarX, type LucideIcon } from "lucide-react";

export function EmptyState({
  Icon = CalendarX,
  title,
  message,
}: {
  Icon?: LucideIcon;
  title: string;
  message?: string;
}) {
  return (
    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl px-6 py-14 text-center shadow-lg">
      <div className="mx-auto mb-4 grid place-items-center h-20 w-20 rounded-3xl bg-vanguard-volt/10 text-vanguard-volt">
        <Icon className="h-9 w-9" strokeWidth={1.75} />
      </div>
      <p className="font-bold text-zinc-800 dark:text-zinc-100">{title}</p>
      {message && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">{message}</p>}
    </div>
  );
}
