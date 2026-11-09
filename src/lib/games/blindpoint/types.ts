export type BlindPointPack = "villes_france" | "monuments_monde" | "chateaux_france";

export type BlindPointMode = "daily" | "free";

export interface BlindPointTarget {
  id: string;
  name: string;
  subtitle: string; // e.g. "Loir-et-Cher, Centre-Val de Loire, France" or "Agra, Inde"
  latitude: number;
  longitude: number;
  scale: "fr" | "world";
  pack: BlindPointPack;
  funFact?: string;
}

export interface BlindPointClientTarget {
  id: string;
  name: string;
  subtitle: string;
  pack: BlindPointPack;
  scale: "fr" | "world";
  roundIndex: number;
  totalRounds: number;
}

export interface BlindPointGuessRequest {
  pack: BlindPointPack;
  mode: BlindPointMode;
  seed: string;
  roundIndex: number;
  targetId: string;
  guessLat: number;
  guessLon: number;
}

export interface BlindPointRoundResult {
  roundIndex: number;
  target: BlindPointTarget;
  guess: {
    lat: number;
    lon: number;
  };
  distanceKm: number;
  score: number;
  ratingEmoji: string;
  ratingLabel: string;
}

export interface BlindPointSessionInitResponse {
  sessionId: string;
  pack: BlindPointPack;
  mode: BlindPointMode;
  scale: "fr" | "world";
  seed: string;
  totalRounds: number;
  currentTarget: BlindPointClientTarget;
}

export interface BlindPointGuessResponse {
  roundIndex: number;
  target: BlindPointTarget;
  guess: {
    lat: number;
    lon: number;
  };
  distanceKm: number;
  score: number;
  ratingEmoji: string;
  ratingLabel: string;
  nextTarget: BlindPointClientTarget | null;
  isGameOver: boolean;
}

export interface BlindPointSettings {
  showBorders: boolean;
  showRegionHints: boolean; // Afficher le département / région / pays
  timerDurationSeconds: 0 | 30 | 60; // 0 = off
}

export const DEFAULT_BLINDPOINT_SETTINGS: BlindPointSettings = {
  showBorders: true,
  showRegionHints: false, // Désactivé par défaut pour ne pas donner trop d'indices
  timerDurationSeconds: 0,
};
