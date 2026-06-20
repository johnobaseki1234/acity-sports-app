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

export type CompetitionType = "league" | "cup" | "super_cup";

export type Competition = {
  id: string;
  name: string;
  season_id: string;
  sport_id: string;
  type: CompetitionType;
  created_at: string;
};

export type FormationPosition = {
  role: string;
  x: number;
  y: number;
};

export type Formation = {
  id: string;
  sport_id: string;
  name: string;
  positions: FormationPosition[];
  created_at: string;
};

export type LineupEntry = {
  id: string;
  match_id: string;
  team_id: string;
  player_id: string;
  role: string;
  x: number;
  y: number;
  is_starter: boolean;
  created_at: string;
};

export type CompetitionMatch = {
  id: string;
  competition_id: string;
  home_team_id: string;
  away_team_id: string;
  week: number | null;
  round: string | null;
  status: MatchStatus;
  scheduled_at: string | null;
  created_at: string;

  home_team?: Team;
  away_team?: Team;
  competition?: Competition;
};

export type PlayerMatchStats = {
  id: string;
  match_id: string;
  player_id: string;

  points: number;

  fg2_made: number;
  fg2_attempts: number;

  fg3_made: number;
  fg3_attempts: number;

  rebounds: number;
  assists: number;
  steals: number;
  turnovers: number;

  goals: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  clean_sheet: boolean;

  created_at: string;

  player?: Player;
};
export type MatchLineup = {
  id: string;
  match_id: string;
  team_id: string;
  player_id: string;
  role: string;
  x: number;
  y: number;
  is_starter: boolean;
  created_at: string;

  player?: Player;
};

export type Substitution = {
  id: string;
  match_id: string;
  team_id: string;
  player_out_id: string;
  player_in_id: string;
  minute: number | null;
  created_at: string;

  player_out?: Player;
  player_in?: Player;
};

export type PlayerStats = {
  player_id: string;

  // Football Performance Fields
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  minutes_played: number;

  // Basketball Performance Fields
  two_pointers_made: number;
  two_pointers_attempted: number;
  three_pointers_made: number;
  three_pointers_attempted: number;
  free_throws_made: number;
  free_throws_attempted: number;
  rebounds: number;
  offensive_rebounds: number;
  defensive_rebounds: number;
  steals: number;
  blocks: number;

  // Derived Performance Metrics
  field_goal_percentage: number;
  three_point_percentage: number;
  free_throw_percentage: number;
};