"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart2, Calendar, Trophy, User, type LucideIcon } from "lucide-react";

const ITEMS: { label: string; Icon: LucideIcon; href: string; match: (p: string) => boolean }[] = [
  { label: "Home", Icon: Home, href: "/", match: (p) => p === "/" },
  { label: "Stats", Icon: BarChart2, href: "/leaders", match: (p) => p.startsWith("/leaders") },
  { label: "Fixtures", Icon: Calendar, href: "/fixtures/basketball", match: (p) => p.startsWith("/fixtures") },
  { label: "Standings", Icon: Trophy, href: "/standings/basketball", match: (p) => p.startsWith("/standings") },
  { label: "Profile", Icon: User, href: "/following", match: (p) => p.startsWith("/following") },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/scorer") ||
    pathname.startsWith("/stealth") ||
    pathname.startsWith("/login")
  )
    return null;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 pb-safe">
      <div className="relative mx-3 mb-2 glass-strong rounded-3xl shadow-xl shadow-black/40 overflow-hidden">
        {/* Sharp volt tracking line */}
        <div aria-hidden className="absolute top-0 inset-x-4 h-px bg-vanguard-volt/25" />
        <div className="grid grid-cols-5">
          {ITEMS.map(({ label, Icon, href, match }) => {
            const active = match(pathname);
            return (
              <Link
                key={label}
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className="relative flex flex-col items-center justify-center gap-1 min-h-[56px] py-2 transition active:scale-95"
              >
                {active && <span className="absolute top-1.5 h-1 w-8 rounded-full bg-vanguard-volt transition-all" />}
                <Icon
                  className={`h-[22px] w-[22px] transition-all ${
                    active
                      ? "text-vanguard-volt scale-110"
                      : "text-zinc-400 dark:text-zinc-500"
                  }`}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span
                  className={`text-[10px] font-semibold ${
                    active ? "text-vanguard-volt" : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}