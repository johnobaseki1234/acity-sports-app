"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Shield, UserRound, CalendarRange, Swords, type LucideIcon } from "lucide-react";

const NAV: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/teams", label: "Teams", Icon: Shield },
  { href: "/admin/players", label: "Players", Icon: UserRound },
  { href: "/admin/seasons", label: "Seasons", Icon: CalendarRange },
  { href: "/admin/matches", label: "Matches", Icon: Swords },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-16 z-30 glass border-x-0 border-t-0">
      <div className="max-w-5xl mx-auto px-4 sm:px-5 flex gap-1.5 overflow-x-auto scrollbar-hide py-2.5">
        {NAV.map(({ href, label, Icon }) => {
          const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                isActive
                  ? "bg-red-600 text-white shadow-md shadow-red-600/25"
                  : "text-zinc-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={2.25} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
