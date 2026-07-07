"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { SportIcon } from "@/components/ui/SportIcon";

const SPORTS = [
  { label: "All",        slug: null,         href: "/" },
  { label: "Football",   slug: "football",   href: "/?sport=football" },
  { label: "Basketball", slug: "basketball", href: "/?sport=basketball" },
  { label: "Volleyball", slug: "volleyball", href: "/?sport=volleyball" },
] as const;

export function SportFilters({ activeSport }: { activeSport?: string }) {
  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-1 px-1 py-1">
      {SPORTS.map(({ label, slug, href }) => {
        const active = slug === null ? !activeSport : activeSport === slug;
        return (
          <Link
            key={label}
            href={href}
            className={`shrink-0 h-14 px-6 rounded-2xl flex items-center gap-2.5 font-semibold text-sm transition-all duration-300 active:scale-95 ${
              active
                ? "bg-vanguard-volt text-black shadow-lg shadow-vanguard-volt/25 scale-[1.03]"
                : "glass text-zinc-600 dark:text-zinc-300 hover:scale-105 hover:shadow-md"
            }`}
          >
            {slug === null ? (
              <Sparkles className="h-5 w-5" strokeWidth={2.25} />
            ) : (
              <SportIcon slug={slug} className="h-5 w-5" strokeWidth={2.25} />
            )}
            {label}
          </Link>
        );
      })}
    </div>
  );
}
