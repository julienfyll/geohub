/**
 * Scoring and Geodesic Geometry for Blind Point
 */

import { BlindPointPack } from "./types";

const EARTH_RADIUS_KM = 6371.0088;

/**
 * Calculates stretched exponential score based on distance and pack scale.
 * Formula:
 * Score = min(5000, max(0, round(5000 * exp(- (d / D)^p))))
 * - d <= 1 km: score = 5000 (Bullseye)
 * - France scale: D = 170 km, p = 1.2
 *   (Douceur à courte distance : ~4 740 pts à 15 km, sanction nette à 400 km : ~290 pts)
 * - World scale: D = 2200 km, p = 1.2
 *   (~4 720 pts à 200 km, ~2 050 pts à 2 000 km, ~180 pts à 6 000 km)
 */
export function calculateBlindPointScore(
  distanceKm: number,
  scale: "fr" | "world" | "paris"
): number {
  const bullseyeThreshold = scale === "paris" ? 0.05 : 1.0;
  if (distanceKm <= bullseyeThreshold) {
    return 5000;
  }

  // Paris tolerance: D = 1.5 km (~4600 pts à 300m, ~1840 pts à 1.5 km)
  // France tolerance: D = 170 km (~4740 pts à 15km, ~290 pts à 400km)
  // World tolerance: D = 2200 km (~4720 pts à 200km, ~2050 pts à 2000km)
  const D = scale === "paris" ? 1.5 : scale === "fr" ? 170 : 2200;
  const p = 1.2;
  const rawScore = 5000 * Math.exp(-Math.pow(distanceKm / D, p));
  const rounded = Math.round(rawScore);

  return Math.min(5000, Math.max(0, rounded));
}

export function getScoreRating(
  distanceKm: number,
  score: number,
  scale?: "fr" | "world" | "paris"
): {
  emoji: string;
  label: string;
  colorClass: string;
} {
  const isBullseye =
    (scale === "paris" ? distanceKm <= 0.05 : distanceKm <= 1.0) || score === 5000;
  if (isBullseye) {
    return {
      emoji: "🎯",
      label: "Bullseye parfait !",
      colorClass: "text-emerald-400 border-emerald-500/50 bg-emerald-500/10",
    };
  }
  if (score >= 4500) {
    return {
      emoji: "🟩",
      label: "Excellente précision",
      colorClass: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
    };
  }
  if (score >= 3500) {
    return {
      emoji: "🟨",
      label: "Bonne estimation",
      colorClass: "text-amber-400 border-amber-500/40 bg-amber-500/10",
    };
  }
  if (score >= 2000) {
    return {
      emoji: "🟧",
      label: "Passable",
      colorClass: "text-orange-400 border-orange-500/40 bg-orange-500/10",
    };
  }
  return {
    emoji: "🟥",
    label: "Trop éloigné",
    colorClass: "text-rose-400 border-rose-500/40 bg-rose-500/10",
  };
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1.0) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km`;
  }
  return `${Math.round(distanceKm).toLocaleString("fr-FR")} km`;
}

/**
 * Creates an interpolated geodesic arc (Great Circle) between two coordinates as a GeoJSON LineString.
 */
export function createGreatCircleArc(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  steps: number = 64
): GeoJSON.Feature<GeoJSON.LineString> {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const phi1 = toRad(lat1);
  const lambda1 = toRad(lon1);
  const phi2 = toRad(lat2);
  const lambda2 = toRad(lon2);

  // Angular distance between points
  const deltaPhi = phi2 - phi1;
  const deltaLambda = lambda2 - lambda1;
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const d = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));

  // If points are virtually identical
  if (d < 1e-6) {
    return {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [lon1, lat1],
          [lon2, lat2],
        ],
      },
    };
  }

  const coordinates: [number, number][] = [];
  let prevLon = lon1;

  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);

    const x = A * Math.cos(phi1) * Math.cos(lambda1) + B * Math.cos(phi2) * Math.cos(lambda2);
    const y = A * Math.cos(phi1) * Math.sin(lambda1) + B * Math.cos(phi2) * Math.sin(lambda2);
    const z = A * Math.sin(phi1) + B * Math.sin(phi2);

    const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lon = Math.atan2(y, x);

    let degLat = toDeg(lat);
    let degLon = toDeg(lon);

    // Mercator limit clamp
    degLat = Math.max(-85.0511, Math.min(85.0511, degLat));

    // Continuous longitude to prevent antimeridian jumps
    if (i > 0) {
      while (degLon - prevLon > 180) degLon -= 360;
      while (degLon - prevLon < -180) degLon += 360;
    }
    prevLon = degLon;

    coordinates.push([degLon, degLat]);
  }

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates,
    },
  };
}
