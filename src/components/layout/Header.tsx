"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "../ui/ThemeToggle";

const SPORTS = [
  { label: "All", slug: "" },
  { label: "Football", slug: "football" },
  { label: "Basketball", slug: "basketball" },
  { label: "Volleyball", slug: "volleyball" },
];

export default function Header() {
  const pathname = usePathname();

  // Full-screen consoles (scorer) and the admin dashboard manage their own chrome.
  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/scorer");
  if (isAdmin) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-colors">
      <div className="max-w-2xl mx-auto px-4">
        <div className="h-16 flex items-center justify-between gap-3">
          {/* Branding */}
          <Link href="/" className="font-bold text-xl tracking-tight text-blue-600 dark:text-blue-400 shrink-0">
            Acity Sports
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/search"
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                pathname.startsWith("/search")
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
              }`}
              aria-label="Search"
            >
              <span>🔍</span>
              <span className="hidden sm:inline">Search</span>
            </Link>
            <ThemeToggle />
          </nav>
        </div>

        {/* Sport navigation pills */}
        <div className="flex gap-2 pb-3 overflow-x-auto scrollbar-hide">
          {SPORTS.map((s) => {
            const href = s.slug ? `/sport/${s.slug}` : "/";
            const isActive =
              s.slug === ""
                ? pathname === "/"
                : pathname.startsWith(`/sport/${s.slug}`) ||
                  pathname.startsWith(`/standings/${s.slug}`) ||
                  pathname.startsWith(`/fixtures/${s.slug}`);
            return (
              <Link
                key={s.slug}
                href={href}
                className={`shrink-0 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
