"use client";

import Link from "next/link";
import { useFollowedTeams } from "@/hooks/useFollowedTeams";
import { EmptyState } from "@/components/ui/EmptyState";

export default function FollowingPage() {
  const { followedTeams } = useFollowedTeams();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">⭐ Following</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Teams you follow — quick access to their fixtures and results.
        </p>
      </div>

      {followedTeams.length === 0 ? (
        <EmptyState
          icon="⭐"
          title="You're not following any teams yet"
          message="Open a team page and tap “Follow Team” to keep their matches close at hand."
        />
      ) : (
        <div className="glass rounded-3xl p-6 text-center">
          <div className="text-4xl mb-2">⭐</div>
          <p className="font-bold text-gray-800 dark:text-zinc-100">
            Following {followedTeams.length} team{followedTeams.length === 1 ? "" : "s"}
          </p>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Browse the latest scores and standings from the home feed.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 shadow-lg shadow-blue-600/20 transition active:scale-95"
          >
            Go to scores →
          </Link>
        </div>
      )}
    </div>
  );
}
