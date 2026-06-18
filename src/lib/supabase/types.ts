export type Sport = {
  id: string;
  name: string;
  slug: "football" | "basketball" | "volleyball";
  icon: string;
  event_types: EventTypeConfig[];
  scoring_rules: Record<string, number>;
  periods: { count: number; name: string; duration_minutes: number | null };
  created_at: string;
};

export type EventTypeConfig = {
  type: string;
  label: string;
  affects_score: boolean;
  score_value?: number; // for the team that did it
  requires_player: boolean;
  color: "green" | "yellow" | "red" | "blue" | "gray";
  icon: string;
};

export type Season = {
  id: string;
  sport_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  standings_config: {
    points_win: number;
    points_draw: number;
    points_loss: number;
  };
  created_at: string;
  sport?: Sport;
};

export type Team = {
  id: string;
  name: string;
  short_name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  created_at: string;
};

export type SeasonTeam = {
  id: string;
  season_id: string;
  team_id: string;
  group_name: string | null;
  team?: Team;
  season?: Season;
};

export type Player = {
  id: string;
  team_id: string;
  name: string;
  jersey_number: number;
  position: string | null;
  secondary_position: string | null;
  photo_url: string | null;
  athlete_key?: string | null;
  status?: "active" | "retired" | "alumni";
  is_active: boolean;
  created_at: string;
  team?: Team;
};

export type MatchStatus =
  | "scheduled"
  | "live"
  | "halftime"
  | "finished"
  | "postponed"
  | "cancelled";

export type Match = {
  id: string;
  season_id: string;
  home_team_id: string;
  away_team_id: string;
  scheduled_at: string;
  venue: string;
  status: MatchStatus;
  current_period: number;
  period_start_time: string | null;
  clock_running: boolean;
  home_score: number;
  away_score: number;
  home_sets: number[] | null;
  away_sets: number[] | null;
  scorer_id: string | null;
  matchday: number | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  home_team?: Team;
  away_team?: Team;
  season?: Season & { sport?: Sport };
};

export type MatchEvent = {
  id: string;
  match_id: string;
  event_type: string;
  team_id: string;
  player_id: string | null;
  assist_player_id: string | null;
  period: number;
  match_minute: number | null;
  details: Record<string, unknown> | null;
  created_at: string;
  created_by: string;
  team?: Team;
  player?: Player;
  assist_player?: Player;
};

export type Standing = {
  season_id: string;
  team_id: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  team?: Team;
};

export type AdminUser = {
  id: string;
  user_id: string;
  role: "super_admin" | "scorer";
  name: string;
  created_at: string;
};
