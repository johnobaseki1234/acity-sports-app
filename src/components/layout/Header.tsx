"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Bell } from "lucide-react";
import { HeaderSearch } from "@/components/ui/HeaderSearch";

const NAV = [
  { label: "Home", href: "/", match: (p: string) => p === "/" },
  { label: "Fixtures", href: "/fixtures/basketball", match: (p: string) => p.startsWith("/fixtures") },
  { label: "Leaders", href: "/leaders", match: (p: string) => p.startsWith("/leaders") },
  { label: "Standings", href: "/standings/basketball", match: (p: string) => p.startsWith("/standings") },
  { label: "Following", href: "/following", match: (p: string) => p.startsWith("/following") },
];

export default function Header() {
  const pathname = usePathname();

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/scorer") ||
    pathname.startsWith("/stealth") ||
    pathname.startsWith("/login")
  )
    return null;

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="glass-strong border-x-0 border-t-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-5 h-16 flex items-center justify-between gap-4">
          {/* Brand lockup */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <span className="grid place-items-center h-10 w-10 rounded-2xl bg-vanguard-volt text-black shadow-lg shadow-vanguard-volt/25 transition-transform group-active:scale-95">
              <Trophy className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <span className="leading-tight">
              <span className="block font-extrabold tracking-tight text-[15px] text-white">
                VAN<span className="text-vanguard-volt">GUARD</span>
              </span>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                The Collegiate Sports OS
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    active
                      ? "bg-vanguard-volt text-black shadow-md shadow-vanguard-volt/25"
                      : "text-zinc-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Embedded Live Multi-Sport Stats Search Trigger Component */}
            <HeaderSearch />

            <button
              aria-label="Notifications"
              className="relative grid place-items-center h-10 w-10 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 transition active:scale-95"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-vanguard-crimson ring-2 ring-white dark:ring-zinc-900" />
            </button>
            
            <button
              aria-label="Account"
              className="grid place-items-center h-10 w-10 rounded-xl bg-zinc-800 border border-zinc-700 text-xs font-black text-vanguard-volt transition active:scale-95"
            >
              V
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}