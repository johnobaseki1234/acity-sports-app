"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Calendar, Trophy, User, type LucideIcon } from "lucide-react";

const ITEMS: { label: string; Icon: LucideIcon; href: string; match: (p: string) => boolean }[] = [
  { label: "Home", Icon: Home, href: "/", match: (p) => p === "/" },
  { label: "Search", Icon: Search, href: "/search", match: (p) => p.startsWith("/search") },
  { label: "Fixtures", Icon: Calendar, href: "/fixtures/basketball", match: (p) => p.startsWith("/fixtures") },
  { label: "Standings", Icon: Trophy, href: "/standings/basketball", match: (p) => p.startsWith("/standings") },
  { label: "Profile", Icon: User, href: "/following", match: (p) => p.startsWith("/following") },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/scorer")) return null;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 pb-safe">
      <div className="mx-3 mb-2 glass-strong rounded-3xl shadow-xl shadow-black/10">
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
                {active && <span className="absolute top-1.5 h-1 w-8 rounded-full bg-red-600 transition-all" />}
                <Icon
                  className={`h-[22px] w-[22px] transition-all ${
                    active
                      ? "text-red-600 dark:text-red-500 scale-110"
                      : "text-zinc-400 dark:text-zinc-500"
                  }`}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span
                  className={`text-[10px] font-semibold ${
                    active ? "text-red-600 dark:text-red-500" : "text-zinc-400 dark:text-zinc-500"
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
