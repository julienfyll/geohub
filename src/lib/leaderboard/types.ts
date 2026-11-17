export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  score: number;
  maxScore?: number;
  primaryCriterion: string;
  secondaryCriterion: string;
  tieBreakerCriterion?: string;
  isTieBroken?: boolean;
  detailText: string;
  accuracyPercent?: number;
  timeSpentSeconds?: number;
  challengesPlayed?: number;
  createdAt: string;
  isCurrentUser?: boolean;
}

export interface LeaderboardResponse {
  gameMode: "georings" | "blindpoint" | "borderpath" | "capitalblitz";
  variant: string;
  scope: "daily" | "week" | "alltime" | "streaks";
  scoringMode: "best_run" | "championship";
  date: string;
  totalPlayers: number;
  entries: LeaderboardEntry[];
  currentUserRank?: {
    rank: number;
    entry: LeaderboardEntry;
  } | null;
}
