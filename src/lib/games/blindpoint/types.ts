export type BlindPointCategory = "villes" | "lieux_emblematiques";

export type BlindPointPack =
  | "villes_france"
  | "villes_monde"
  | "villes_europe"
  | "lieux_france"
  | "lieux_monde"
  | "lieux_paris"
  | "metro_paris"
  | "monuments_monde"
  | "chateaux_france";

export type BlindPointDifficulty = "facile" | "moyen" | "difficile";

export type BlindPointMode = "daily" | "free" | "custom";

export interface BlindPointTarget {
  id: string;
  name: string;
  subtitle: string; // e.g. "Loir-et-Cher, Centre-Val de Loire, France" or "Agra, Inde"
  latitude: number;
  longitude: number;
  scale: "fr" | "world" | "paris";
  pack: BlindPointPack;
  difficulty?: BlindPointDifficulty;
  continent?: string;
  funFact?: string;
  imageUrl?: string;
  imageCredit?: string;
  arrondissement?: number;
  bank?: "rive_droite" | "rive_gauche" | "ile" | "pont";
  category?: string;
  yearBuilt?: number;
}

export interface BlindPointClientTarget {
  id: string;
  name: string;
  subtitle: string;
  pack: BlindPointPack;
  scale: "fr" | "world" | "paris";
  difficulty?: BlindPointDifficulty;
  roundIndex: number;
  totalRounds: number;
  imageUrl?: string;
  imageCredit?: string;
  funFact?: string;
  arrondissement?: number;
  bank?: "rive_droite" | "rive_gauche" | "ile" | "pont";
  category?: string;
  yearBuilt?: number;
}

export interface BlindPointGuessRequest {
  pack: BlindPointPack;
  packs?: BlindPointPack[];
  mode: BlindPointMode;
  difficulty?: BlindPointDifficulty | "all";
  seed: string;
  roundIndex: number;
  totalRounds?: number;
  continent?: string;
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
  packs?: BlindPointPack[];
  mode: BlindPointMode;
  difficulty?: BlindPointDifficulty | "all";
  scale: "fr" | "world" | "paris";
  seed: string;
  totalRounds: number;
  timerSeconds?: number;
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

export type BlindPointMapTheme = "dark" | "voyager" | "satellite";

export interface BlindPointSettings {
  showBorders: boolean;
  showRoads: boolean; // Afficher la voirie, boulevards et ponts (sans aucun nom)
  showNature: boolean; // Afficher les espaces verts (parcs, forêts) et l'hydrographie (fleuves, lacs)
  showRegionHints: boolean; // Afficher le département / région / pays
  showTargetPhoto: boolean; // Afficher la photo de l'édifice
  showTargetName: boolean; // Afficher le nom de l'édifice
  timerDurationSeconds: number; // 0 = off, 10, 15, 30, 45, 60, etc.
  mapTheme: BlindPointMapTheme;
}

export const DEFAULT_BLINDPOINT_SETTINGS: BlindPointSettings = {
  showBorders: true,
  showRoads: true,
  showNature: true,
  showRegionHints: false, // Désactivé par défaut pour ne pas donner trop d'indices
  showTargetPhoto: true,
  showTargetName: true,
  timerDurationSeconds: 0,
  mapTheme: "dark", // Sombre Voyageur par défaut (espaces verts, fleuves & voirie préservés)
};
