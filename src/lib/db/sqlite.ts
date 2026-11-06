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
 * Searches both official names and alternate names (French names, exonyms, transliterations).
 */
export function searchCities(
  query: string,
  scale: GameScale,
  limit: number = 8
): (City & { matchedAlias?: string })[] {
  const norm = normalizeText(query);
  if (!norm || norm.length < 2) return [];

  const db = getDb();
  const startsWith = `${norm}%`;
  const contains = `% ${norm}%`;

  const stmt = db.prepare(`
    WITH matches AS (
      -- Direct city name match
      SELECT id, name, NULL as matchedAlias, country_code as countryCode, scale, population, latitude, longitude, timezone,
             CASE 
               WHEN normalized_name = ? THEN 0 
               WHEN normalized_name LIKE ? THEN 1 
               ELSE 2 
             END as rank_score
      FROM cities
      WHERE scale = ? AND (normalized_name LIKE ? OR normalized_name LIKE ?)

      UNION ALL

      -- Alias match (French names, local exonyms, transliterations)
      SELECT c.id, c.name, a.alias as matchedAlias, c.country_code as countryCode, c.scale, c.population, c.latitude, c.longitude, c.timezone,
             CASE 
               WHEN a.normalized_alias = ? THEN 0 
               WHEN a.normalized_alias LIKE ? THEN 1 
               ELSE 2 
             END as rank_score
      FROM city_aliases a
      JOIN cities c ON a.city_id = c.id
      WHERE a.scale = ? AND (a.normalized_alias LIKE ? OR a.normalized_alias LIKE ?)
    )
    SELECT id, name, matchedAlias, countryCode, scale, population, latitude, longitude, timezone
    FROM matches
    GROUP BY id
    ORDER BY min(rank_score) ASC, population DESC
    LIMIT ?
  `);

  const rows = stmt.all(
    norm,
    startsWith,
    scale,
    startsWith,
    contains,
    norm,
    startsWith,
    scale,
    startsWith,
    contains,
    limit
  ) as unknown as (City & { matchedAlias?: string })[];

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
  // Minimum distance of 1.0 km ensures the seed center city itself is never counted in Ring 1
  const minAllowedDist = Math.max(1.0, innerRadiusKm);
  const inRing = candidates.filter((city) => {
    const dist = getDistanceKm(centerLat, centerLon, city.latitude, city.longitude);
    return dist > minAllowedDist && dist <= outerRadiusKm;
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
 * Calibrated linear radii progression tailored to user constraints:
 * - France: [80, 160, 240, 320, 400] (step: +80 km)
 * - Europe: [200, 400, 600, 800, 1000] (max: 1000 km, step: +200 km)
 * - World:  [600, 1200, 1800, 2400, 3000] (max: 3000 km, step: +600 km)
 */
export function getDefaultRadii(scale: GameScale): number[] {
  switch (scale) {
    case "fr":
      return [80, 160, 240, 320, 400];
    case "eu":
      // Europe: min 200 km, max 1000 km (regular step +200 km)
      return [200, 400, 600, 800, 1000];
    case "world":
      // World: min 600 km, max 3000 km (regular step +600 km)
      return [600, 1200, 1800, 2400, 3000];
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
