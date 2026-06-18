"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, CircleDot, Circle, Volleyball, type LucideIcon } from "lucide-react";

const SPORTS: { label: string; Icon: LucideIcon; href: string; match: (p: string) => boolean }[] = [
  { label: "All", Icon: Sparkles, href: "/", match: (p) => p === "/" },
  { label: "Football", Icon: CircleDot, href: "/sport/football", match: (p) => p.startsWith("/sport/football") },
  { label: "Basketball", Icon: Circle, href: "/sport/basketball", match: (p) => p.startsWith("/sport/basketball") },
  { label: "Volleyball", Icon: Volleyball, href: "/sport/volleyball", match: (p) => p.startsWith("/sport/volleyball") },
];

export function SportFilters() {
  const pathname = usePathname();

  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-1 px-1 py-1">
      {SPORTS.map(({ label, Icon, href, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={label}
            href={href}
            className={`shrink-0 h-14 px-6 rounded-2xl flex items-center gap-2.5 font-semibold text-sm transition-all duration-300 active:scale-95 ${
              active
                ? "bg-gradient-to-br from-red-600 to-red-800 text-white shadow-lg shadow-red-500/25 scale-[1.03]"
                : "glass text-zinc-600 dark:text-zinc-300 hover:scale-105 hover:shadow-md"
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={2.25} />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
