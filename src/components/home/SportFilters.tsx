"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SPORTS = [
  { label: "All", icon: "✨", href: "/", match: (p: string) => p === "/" },
  { label: "Football", icon: "⚽", href: "/sport/football", match: (p: string) => p.startsWith("/sport/football") },
  { label: "Basketball", icon: "🏀", href: "/sport/basketball", match: (p: string) => p.startsWith("/sport/basketball") },
  { label: "Volleyball", icon: "🏐", href: "/sport/volleyball", match: (p: string) => p.startsWith("/sport/volleyball") },
];

export function SportFilters() {
  const pathname = usePathname();

  return (
    <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-1 px-1 py-1">
      {SPORTS.map((s) => {
        const active = s.match(pathname);
        return (
          <Link
            key={s.label}
            href={s.href}
            className={`shrink-0 h-14 px-5 rounded-2xl flex items-center gap-2.5 font-bold text-sm transition-all duration-300 active:scale-95 ${
              active
                ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25 scale-[1.02]"
                : "glass text-gray-600 dark:text-zinc-300 hover:-translate-y-0.5 hover:shadow-md"
            }`}
          >
            <span className="text-xl">{s.icon}</span>
            {s.label}
          </Link>
        );
      })}
    </div>
  );
}
