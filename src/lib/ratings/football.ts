import { MatchEvent } from "../supabase/types";

export function calculateFootballRating(
  events: MatchEvent[]
) {
  let rating = 6;

  events.forEach((event) => {
    switch (event.event_type) {
      case "goal":
        rating += 1.5;
        break;

      case "assist":
        rating += 1;
        break;

      case "yellow_card":
        rating -= 0.5;
        break;

      case "red_card":
        rating -= 1.5;
        break;

      case "own_goal":
        rating -= 1;
        break;
    }
  });

  return Math.max(
    0,
    Math.min(10, rating)
  );
}