import { CircleDot, Circle, Volleyball, Trophy, type LucideProps } from "lucide-react";

// Maps a sport slug to a clean monochrome line icon (no emojis).
export function SportIcon({ slug, ...props }: { slug?: string } & LucideProps) {
  switch (slug) {
    case "football":
      return <CircleDot {...props} />;
    case "basketball":
      return <Circle {...props} />;
    case "volleyball":
      return <Volleyball {...props} />;
    default:
      return <Trophy {...props} />;
  }
}
