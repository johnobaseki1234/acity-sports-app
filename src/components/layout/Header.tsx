"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SPORTS = [
  { label: "All", slug: "" },
  { label: "Football", slug: "football" },
  { label: "Basketball", slug: "basketball" },
  { label: "Volleyball", slug: "volleyball" },
];

export function Header() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/scorer");

  if (isAdmin) return null;

  return (
    <header className="bg-brand-blue text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 gap-3">
          <Link href="/" className="font-bold text-lg tracking-tight shrink-0">
            ACity <span className="text-yellow-400">Sports</span>
          </Link>
          <Link
            href="/search"
            className={`text-sm font-semibold rounded-full px-3 py-1.5 transition-colors ${
              pathname.startsWith("/search")
                ? "bg-white text-brand-blue"
                : "bg-blue-800/50 text-blue-100 hover:bg-blue-700/60"
            }`}
          >
            Search
          </Link>
        </div>

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
                    ? "bg-white text-brand-blue"
                    : "bg-blue-800/50 text-blue-100 hover:bg-blue-700/60"
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
