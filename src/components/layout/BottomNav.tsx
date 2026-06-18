"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { label: "Home", icon: "🏠", href: "/", match: (p: string) => p === "/" },
  { label: "Search", icon: "🔍", href: "/search", match: (p: string) => p.startsWith("/search") },
  { label: "Fixtures", icon: "📅", href: "/fixtures/basketball", match: (p: string) => p.startsWith("/fixtures") },
  { label: "Standings", icon: "🏆", href: "/standings/basketball", match: (p: string) => p.startsWith("/standings") },
  { label: "Profile", icon: "👤", href: "/following", match: (p: string) => p.startsWith("/following") },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/scorer")) return null;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 pb-safe">
      <div className="mx-3 mb-2 glass-strong rounded-3xl shadow-xl shadow-black/5">
        <div className="grid grid-cols-5">
          {ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className="relative flex flex-col items-center justify-center gap-1 min-h-[56px] py-2 transition active:scale-95"
              >
                {active && (
                  <span className="absolute top-1.5 h-1 w-8 rounded-full bg-blue-600 transition-all" />
                )}
                <span
                  className={`text-xl transition-transform ${active ? "scale-110" : "opacity-70"}`}
                >
                  {item.icon}
                </span>
                <span
                  className={`text-[10px] font-semibold ${
                    active ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-zinc-500"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
