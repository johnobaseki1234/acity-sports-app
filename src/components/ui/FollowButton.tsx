"use client";

import { Star } from "lucide-react";
import { useFollowedTeams } from "../../hooks/useFollowedTeams";

interface FollowButtonProps {
  teamId: string;
}

export default function FollowButton({ teamId }: FollowButtonProps) {
  const { toggleTeam, isFollowing } = useFollowedTeams();
  const following = isFollowing(teamId);

  return (
    <button
      onClick={() => toggleTeam(teamId)}
      className={`mt-3 inline-flex items-center gap-2 h-12 px-5 rounded-2xl text-sm font-semibold transition-all duration-300 active:scale-95 ${
        following
          ? "bg-white/25 text-white border border-white/40 hover:bg-white/35"
          : "bg-white text-red-600 hover:bg-red-50 shadow-lg"
      }`}
    >
      <Star className={`h-4 w-4 ${following ? "fill-white" : "fill-red-600"}`} />
      {following ? "Following" : "Follow Team"}
    </button>
  );
}
