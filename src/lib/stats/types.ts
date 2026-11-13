export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export interface UserStreak {
  user_id: string;
  current_streak: number;
  best_streak: number;
  last_played_date: string | null;
}

export interface GameSessionRecord {
  id?: string;
  user_id?: string;
  game_mode: "georings" | "blindpoint" | "borderpath";
  variant: string; // 'cities', 'airports', 'prefectures', etc.
  difficulty: string; // 'fr', 'eu', 'world', 'easy', etc.
  score: number;
  max_score?: number | null;
  rings_completed?: number | null;
  total_rings?: number | null;
  accuracy_percent?: number | null;
  distance_km?: number | null;
  time_spent_seconds?: number | null;
  summary_data?: Record<string, any>;
  created_at?: string;
}

export interface UserSummaryStats {
  totalGames: number;
  georingsGames: number;
  blindpointGames: number;
  borderpathGames?: number;
  perfectGames: number;
  averageScore: number;
  currentStreak: number;
  bestStreak: number;
  recentSessions: GameSessionRecord[];
}
