export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  score: number;
  maxScore?: number;
  detailText: string;
  accuracyPercent?: number;
  createdAt: string;
  isCurrentUser?: boolean;
}

export interface LeaderboardResponse {
  gameMode: "georings" | "blindpoint" | "borderpath";
  variant: string;
  scope: "daily" | "streaks";
  date: string;
  totalPlayers: number;
  entries: LeaderboardEntry[];
  currentUserRank?: {
    rank: number;
    entry: LeaderboardEntry;
  } | null;
}
