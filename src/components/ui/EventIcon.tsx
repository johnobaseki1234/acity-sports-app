import {
  Target,
  Square,
  ArrowLeftRight,
  Flag,
  X,
  Users,
  Hand,
  Shield,
  Repeat,
  Pause,
  Play,
  Clock,
  CircleDot,
  type LucideProps,
} from "lucide-react";

// Maps a match-event type to a clean line icon (replaces the emoji stored in
// the sport's DB config). Falls back to a neutral dot.
const MAP: Record<string, React.ComponentType<LucideProps>> = {
  goal: Target,
  penalty_scored: Target,
  own_goal: Target,
  points_2: Target,
  points_3: Target,
  free_throw_made: Target,
  point: Target,
  ace: Target,
  kill: Target,
  yellow_card: Square,
  red_card: Square,
  substitution: ArrowLeftRight,
  foul: Flag,
  technical_foul: Flag,
  service_error: X,
  penalty_missed: X,
  free_throw_missed: X,
  assist: Users,
  steal: Hand,
  block: Shield,
  rebound: Repeat,
  rebound_offensive: Repeat,
  rebound_defensive: Repeat,
  shot: CircleDot,
  shot_on_target: Target,
  save: Hand,
  tackle_won: Shield,
  interception: Shield,
  timeout: Clock,
  half_start: Play,
  quarter_start: Play,
  set_start: Play,
  half_end: Pause,
  quarter_end: Pause,
  set_end: Pause,
  match_end: Flag,
};

export function EventIcon({ type, ...props }: { type: string } & LucideProps) {
  const Icon = MAP[type] ?? CircleDot;
  return <Icon {...props} />;
}
