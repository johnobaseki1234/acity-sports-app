import type { LucideProps } from "lucide-react";
import { Volleyball, Trophy } from "lucide-react";

function FootballIcon({ className, strokeWidth = 2, size, ...props }: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size ?? 24}
      height={size ?? 24}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      {/* Center hexagon panel */}
      <polygon points="12,9 14.6,10.5 14.6,13.5 12,15 9.4,13.5 9.4,10.5" />
      {/* Seam lines from each hexagon vertex to circle edge */}
      <line x1="12" y1="9" x2="12" y2="2" />
      <line x1="14.6" y1="10.5" x2="20.7" y2="7" />
      <line x1="14.6" y1="13.5" x2="20.7" y2="17" />
      <line x1="12" y1="15" x2="12" y2="22" />
      <line x1="9.4" y1="13.5" x2="3.3" y2="17" />
      <line x1="9.4" y1="10.5" x2="3.3" y2="7" />
    </svg>
  );
}

function BasketballIcon({ className, strokeWidth = 2, size, ...props }: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={size ?? 24}
      height={size ?? 24}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      {/* Horizontal seam */}
      <line x1="2" y1="12" x2="22" y2="12" />
      {/* Left curved seam */}
      <path d="M12 2 C8 5 8 19 12 22" />
      {/* Right curved seam */}
      <path d="M12 2 C16 5 16 19 12 22" />
    </svg>
  );
}

export function SportIcon({ slug, ...props }: { slug?: string } & LucideProps) {
  switch (slug) {
    case "football":
      return <FootballIcon {...props} />;
    case "basketball":
      return <BasketballIcon {...props} />;
    case "volleyball":
      return <Volleyball {...props} />;
    default:
      return <Trophy {...props} />;
  }
}
