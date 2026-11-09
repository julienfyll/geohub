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
