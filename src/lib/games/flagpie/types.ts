export type FlagPiePack = "monde" | "europe" | "afrique" | "ameriques" | "asie";
export type FlagPieMode = "daily" | "free";

export interface FlagColorSlice {
  color: string;      // e.g. "Bleu", "Blanc", "Rouge"
  hex: string;        // e.g. "#0055A4"
  percentage: number; // e.g. 33.33
}

export interface FlagPieCountry {
  id: string;          // ISO3 code: "FRA", "DEU", etc.
  name: string;        // "France"
  aliases: string[];   // ["republique francaise", "french"]
  flag: string;        // "🇫🇷"
  continent: "Europe" | "Africa" | "Americas" | "Asia" | "Oceania";
  capital: string;     // "Paris"
  slices: FlagColorSlice[];
  difficulty: 1 | 2 | 3;
  trivia?: string;
}

export interface FlagPieRoundState {
  roundNumber: number;
  slices: FlagColorSlice[];
  attemptsCount: number;       // 0, 1, 2, 3
  revealedContinent?: string;  // Revealed on attempt 2 (after 1st fail)
  revealedFirstLetter?: string; // Revealed on attempt 3 (after 2nd fail)
  isComplete: boolean;
  isSkipped: boolean;
  score: number;               // 5000, 3000, 1000, or 0
  revealedCountry?: {
    id: string;
    name: string;
    flag: string;
    capital: string;
    continent: string;
    trivia?: string;
  };
}

export interface FlagPieClientRoundInit {
  roundNumber: number;
  slices: FlagColorSlice[];
}

export interface FlagPieSessionInit {
  sessionId: string;
  pack: FlagPiePack;
  mode: FlagPieMode;
  dateStr: string;
  totalRounds: number;
  currentRoundIndex: number;
  rounds: FlagPieClientRoundInit[];
}

export interface FlagPieGuessResult {
  isCorrect: boolean;
  roundComplete: boolean;
  gameOver: boolean;
  attemptNumber: number;       // 1, 2, 3
  scoreEarned: number;
  totalScore: number;
  revealedContinent?: string;
  revealedFirstLetter?: string;
  revealedCountry?: {
    id: string;
    name: string;
    flag: string;
    capital: string;
    continent: string;
    trivia?: string;
  };
  message: string;
}

export interface FlagPiePackConfig {
  id: FlagPiePack;
  name: string;
  badge: string;
  icon: string;
  description: string;
}
