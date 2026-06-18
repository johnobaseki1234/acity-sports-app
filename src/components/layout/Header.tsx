"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "../ui/ThemeToggle";

const NAV = [
  { label: "Home", href: "/", match: (p: string) => p === "/" },
  { label: "Fixtures", href: "/fixtures/basketball", match: (p: string) => p.startsWith("/fixtures") },
  { label: "Search", href: "/search", match: (p: string) => p.startsWith("/search") },
  { label: "Standings", href: "/standings/basketball", match: (p: string) => p.startsWith("/standings") },
  { label: "Following", href: "/following", match: (p: string) => p.startsWith("/following") },
];

export default function Header() {
  const pathname = usePathname();

  // Full-screen consoles (scorer) and the admin dashboard manage their own chrome.
  if (pathname.startsWith("/admin") || pathname.startsWith("/scorer")) return null;

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="glass-strong border-x-0 border-t-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-5 h-16 flex items-center justify-between gap-4">
          {/* Brand lockup */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <span className="grid place-items-center h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-lg shadow-lg shadow-blue-600/20 transition-transform group-active:scale-95">
              🏆
            </span>
            <span className="leading-tight">
              <span className="block font-extrabold tracking-tight text-[15px] text-gray-900 dark:text-white">
                ACITY <span className="text-blue-600 dark:text-blue-400">SPORTS</span>
              </span>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                Live University Sports
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
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "text-gray-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href="/search"
              aria-label="Search"
              className="md:hidden grid place-items-center h-10 w-10 rounded-xl text-lg hover:bg-black/5 dark:hover:bg-white/5 transition active:scale-95"
            >
              🔍
            </Link>
            <ThemeToggle />
            <button
              aria-label="Notifications"
              className="relative grid place-items-center h-10 w-10 rounded-xl text-lg hover:bg-black/5 dark:hover:bg-white/5 transition active:scale-95"
            >
              🔔
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-zinc-900" />
            </button>
            <button
              aria-label="Account"
              className="grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-zinc-700 dark:to-zinc-800 text-sm font-bold text-gray-600 dark:text-zinc-200 transition active:scale-95"
            >
              AC
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
