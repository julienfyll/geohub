export type GameScale = "fr" | "eu" | "world";

export interface City {
  id: string;
  name: string;
  normalizedName?: string;
  countryCode: string;
  scale: GameScale;
  population: number;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface TopCityItem {
  rank: number;
  id: string;
  name: string;
  countryCode: string;
  population: number;
  latitude: number;
  longitude: number;
}

export interface CityGuessResult {
  city: {
    id: string;
    name: string;
    countryCode: string;
    population: number;
    latitude: number;
    longitude: number;
  };
  isInRing: boolean;
  distanceFromCenterKm: number;
  isTarget: boolean;
  guessRank?: number;
  directionHint?: {
    code: string;
    label: string;
    arrow: string;
  };
  targetCityIfRevealed?: {
    id: string;
    name: string;
    countryCode: string;
    population: number;
    latitude: number;
    longitude: number;
  };
  topCities?: TopCityItem[];
  triesLeft: number;
  ringCompleted: boolean;
  ringFailed: boolean;
  message: string;
}

export interface RingConfig {
  index: number;
  innerRadiusKm: number;
  outerRadiusKm: number;
}

export interface GeoRingsInitResponse {
  sessionId: string;
  scale: GameScale;
  mode: "daily" | "free" | "custom";
  continent?: string;
  maxTriesPerRing?: number;
  seedCity: {
    id: string;
    name: string;
    countryCode: string;
    population: number;
    latitude: number;
    longitude: number;
  };
  radii: number[];
  rings: {
    index: number;
    innerRadiusKm: number;
    outerRadiusKm: number;
  }[];
}
