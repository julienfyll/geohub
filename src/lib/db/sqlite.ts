import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { getDistanceKm, getBoundingBox } from "@/lib/geo/haversine";
import { City, GameScale } from "@/lib/games/types";

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    const dbPath = path.join(process.cwd(), "data", "geohub.db");
    dbInstance = new DatabaseSync(dbPath, { open: true, readOnly: true });
  }
  return dbInstance;
}

export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Autocomplete search for cities in the given scale.
 */
export function searchCities(
  query: string,
  scale: GameScale,
  limit: number = 8
): City[] {
  const norm = normalizeText(query);
  if (!norm || norm.length < 2) return [];

  const db = getDb();
  const stmt = db.prepare(`
    SELECT id, name, country_code as countryCode, scale, population, latitude, longitude, timezone
    FROM cities
    WHERE scale = ? AND (normalized_name LIKE ? OR normalized_name LIKE ?)
    ORDER BY 
      CASE WHEN normalized_name LIKE ? THEN 0 ELSE 1 END,
      population DESC
    LIMIT ?
  `);

  const startsWith = `${norm}%`;
  const contains = `% ${norm}%`;
  const exactOrStarts = `${norm}%`;

  const rows = stmt.all(scale, startsWith, contains, exactOrStarts, limit) as unknown as City[];
  return rows;
}

export function getCityById(id: string): City | null {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT id, name, country_code as countryCode, scale, population, latitude, longitude, timezone
    FROM cities
    WHERE id = ?
    LIMIT 1
  `);
  const row = stmt.get(id) as unknown as City | undefined;
  return row || null;
}

/**
 * Retrieves all cities in the annulus (innerRadiusKm, outerRadiusKm], sorted by population DESC.
 */
export function getCitiesInRing(
  centerLat: number,
  centerLon: number,
  innerRadiusKm: number,
  outerRadiusKm: number,
  scale: GameScale
): City[] {
  const db = getDb();
  const [minLon, minLat, maxLon, maxLat] = getBoundingBox(
    centerLat,
    centerLon,
    outerRadiusKm
  );

  // Fast pre-filter using Bounding Box in SQLite
  const stmt = db.prepare(`
    SELECT id, name, country_code as countryCode, scale, population, latitude, longitude, timezone
    FROM cities
    WHERE scale = ?
      AND latitude BETWEEN ? AND ?
      AND longitude BETWEEN ? AND ?
    ORDER BY population DESC
  `);

  const candidates = stmt.all(scale, minLat, maxLat, minLon, maxLon) as unknown as City[];

  // Refine candidates using exact geodesic Haversine distance
  const inRing = candidates.filter((city) => {
    const dist = getDistanceKm(centerLat, centerLon, city.latitude, city.longitude);
    return dist > innerRadiusKm && dist <= outerRadiusKm;
  });

  // Ensure sorted by population descending
  inRing.sort((a, b) => b.population - a.population);
  return inRing;
}

/**
 * Returns the most populated city in the specified ring.
 */
export function getMostPopulatedCityInRing(
  centerLat: number,
  centerLon: number,
  innerRadiusKm: number,
  outerRadiusKm: number,
  scale: GameScale
): City | null {
  const cities = getCitiesInRing(centerLat, centerLon, innerRadiusKm, outerRadiusKm, scale);
  return cities.length > 0 ? cities[0] : null;
}

/**
 * Calibrated radii (in km) for each geographical scale.
 * Adjusted for optimal difficulty and balanced density.
 */
export function getDefaultRadii(scale: GameScale): number[] {
  switch (scale) {
    case "fr":
      // Calibrated for France: Suburban (50km), Regional (110km), Inter-regional (200km), Macro-region (320km), National (450km)
      return [50, 110, 200, 320, 450];
    case "eu":
      // Calibrated for Europe: Proximity (250km), Western hubs (550km), Continental (950km), Cross-European (1500km), Pan-European (2200km)
      return [250, 550, 950, 1500, 2200];
    case "world":
      // Calibrated for World: Sub-continental (800km), Regional (1800km), Transcontinental (3500km), Intercontinental (6000km), Global (9500km)
      return [800, 1800, 3500, 6000, 9500];
  }
}

/**
 * Returns a curated list of seed cities for starting games.
 */
export function getSeedCities(scale: GameScale): City[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT id, name, country_code as countryCode, scale, population, latitude, longitude, timezone
    FROM cities
    WHERE scale = ?
    ORDER BY population DESC
    LIMIT 60
  `);
  return stmt.all(scale) as unknown as City[];
}
