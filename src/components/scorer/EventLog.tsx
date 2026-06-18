import type { MatchEvent, Sport } from "@/lib/supabase/types";
import { EventIcon } from "@/components/ui/EventIcon";

type Props = { events: MatchEvent[]; sport: Sport };

export function EventLog({ events, sport }: Props) {
  if (events.length === 0) {
    return <p className="text-gray-500 text-sm text-center py-4">No events yet</p>;
  }

  return (
    <div className="space-y-1">
      {events.map((event) => (
        <EventRow key={event.id} event={event} sport={sport} />
      ))}
    </div>
  );
}

function EventRow({ event, sport }: { event: MatchEvent; sport: Sport }) {
  const config = sport.event_types.find((e) => e.type === event.event_type);

  const colorMap: Record<string, string> = {
    green: "text-green-400",
    yellow: "text-yellow-400",
    red: "text-red-400",
    blue: "text-blue-400",
    gray: "text-gray-400",
  };

  const isSystemEvent = ["half_start","half_end","match_end","quarter_start","quarter_end","set_start","set_end"].includes(event.event_type);

  if (isSystemEvent) {
    return (
      <div className="text-center py-1">
        <span className="text-xs text-gray-500 font-semibold uppercase">
          — {config?.label ?? event.event_type} —
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
      <EventIcon type={event.event_type} className={`h-4 w-4 shrink-0 ${colorMap[config?.color ?? "gray"]}`} />
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium ${colorMap[config?.color ?? "gray"]}`}>
          {config?.label ?? event.event_type}
        </span>
        {event.player && (
          <span className="text-gray-300 text-sm"> · #{event.player.jersey_number} {event.player.name}</span>
        )}
        <span className="text-xs text-gray-500 ml-1">({event.team?.short_name})</span>
      </div>
      {event.match_minute && (
        <span className="text-xs text-gray-500 shrink-0">{event.match_minute}&apos;</span>
      )}
    </div>
  );
}
