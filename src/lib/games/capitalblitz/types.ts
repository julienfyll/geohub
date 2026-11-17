export interface CapitalItem {
  id: string; // ISO-A3 code (e.g. "FRA", "JPN", "USA")
  name: string; // French country name
  capital: string; // French official capital name
  aliases: string[]; // Variants / alternative acceptable names
  flag: string; // Emoji flag
  continent: string; // Continent / Region name
  latitude: number;
  longitude: number;
}

export type CapitalBlitzMode = "daily" | "sprint60" | "practice" | "custom";
export type CapitalBlitzContinent = "all" | "Europe" | "Africa" | "Asia" | "Americas" | "Oceania";

export interface QuestionAttempt {
  countryId: string;
  countryName: string;
  capital: string;
  userGuess: string;
  isCorrect: boolean;
  isSkipped: boolean;
  points: number;
  comboMultiplier: number;
  flag: string;
}

export interface CapitalBlitzResult {
  score: number;
  correctCount: number;
  totalAttempts: number;
  accuracyPercent: number;
  maxCombo: number;
  durationSeconds: number;
  attempts: QuestionAttempt[];
  seed: string;
}

export interface CapitalBlitzSettings {
  durationSeconds: number;
  continent: CapitalBlitzContinent;
  soundEnabled: boolean;
}

export const DEFAULT_CAPITAL_BLITZ_SETTINGS: CapitalBlitzSettings = {
  durationSeconds: 60,
  continent: "all",
  soundEnabled: true,
};
