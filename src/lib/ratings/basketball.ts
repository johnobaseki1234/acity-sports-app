import { MatchEvent } from "../supabase/types";

export function calculateBasketballRating(
  events: MatchEvent[]
) {
  let rating = 6;

  events.forEach((event) => {
    switch (event.event_type) {
      case "2_pointer":
        rating += 0.2;
        break;

      case "3_pointer":
        rating += 0.4;
        break;

      case "assist":
        rating += 0.3;
        break;

      case "rebound":
        rating += 0.2;
        break;

      case "turnover":
        rating -= 0.3;
        break;
    }
  });

  return Math.max(
    0,
    Math.min(10, rating)
  );
}