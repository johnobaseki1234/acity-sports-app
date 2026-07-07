"use client";

import Link from "next/link";
import { Star, ArrowRight } from "lucide-react";
import { useFollowedTeams } from "@/hooks/useFollowedTeams";
import { EmptyState } from "@/components/ui/EmptyState";

export default function FollowingPage() {
  const { followedTeams } = useFollowedTeams();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <Star className="h-6 w-6 text-vanguard-volt" strokeWidth={2.25} />
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">Following</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Teams you follow — quick access to their fixtures and results.
          </p>
        </div>
      </div>

      {followedTeams.length === 0 ? (
        <EmptyState
          Icon={Star}
          title="You're not following any teams yet"
          message="Open a team page and tap Follow Team to keep their matches close at hand."
        />
      ) : (
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 text-center shadow-lg">
          <div className="mx-auto mb-3 grid place-items-center h-16 w-16 rounded-3xl bg-vanguard-volt/10 text-vanguard-volt">
            <Star className="h-8 w-8" strokeWidth={1.75} />
          </div>
          <p className="font-bold text-zinc-800 dark:text-zinc-100">
            Following {followedTeams.length} team{followedTeams.length === 1 ? "" : "s"}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Browse the latest scores and standings from the home feed.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-2 h-12 rounded-2xl bg-vanguard-volt hover:bg-vanguard-volt/90 text-black font-semibold text-sm px-5 shadow-lg shadow-vanguard-volt/20 transition-all duration-300 active:scale-95"
          >
            Go to scores <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
