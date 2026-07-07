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
          : "bg-vanguard-volt text-black hover:bg-vanguard-volt/90 shadow-lg"
      }`}
    >
      <Star className={`h-4 w-4 ${following ? "fill-white" : "fill-black"}`} />
      {following ? "Following" : "Follow Team"}
    </button>
  );
}
