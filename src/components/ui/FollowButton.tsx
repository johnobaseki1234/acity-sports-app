"use client";

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
      className={`mt-3 px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm ${
        following
          ? "bg-white/30 text-white border border-white/40 hover:bg-white/40"
          : "bg-white text-blue-600 hover:bg-blue-50"
      }`}
    >
      {following ? "Following" : "Follow Team"}
    </button>
  );
}
