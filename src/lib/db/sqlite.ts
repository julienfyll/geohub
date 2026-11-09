import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { getDistanceKm, getBoundingBox } from "@/lib/geo/haversine";
import { City, GameScale } from "@/lib/games/types";

let dbInstance: DatabaseSync | null = null;

function levenshtein(a: string, b: string): number {
  if (!a || !b) return (a || b || "").length;
  if (Math.abs(a.length - b.length) > 2) return 99;
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    const dbPath = path.join(process.cwd(), "data", "geohub.db");
    dbInstance = new DatabaseSync(dbPath, { open: true, readOnly: true });
    dbInstance.function("levenshtein", (a: unknown, b: unknown) => {
      if (typeof a !== "string" || typeof b !== "string") return 99;
      return levenshtein(a, b);
    });
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
 * 1. Fast tiered prefix matching: Official Name (Tier 0-2) > Canonical Alias (Tier 3-4) > Population DESC.
 * 2. Fuzzy fallback: Levenshtein distance <= 2 for typo tolerance (e.g. "montpelier", "bourdeaux", "stasbourg").
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

  // 1. Fast tiered match: Official Name ALWAYS strictly outranks aliases
  const stmt = db.prepare(`
    WITH matches AS (
      -- Tier 0: Exact match on official city name
      SELECT id, name, NULL as matchedAlias, country_code as countryCode, scale, population, latitude, longitude, timezone, 0 as tier
      FROM cities
      WHERE scale = ? AND normalized_name = ?

      UNION ALL

      -- Tier 1: Official name starts with query
      SELECT id, name, NULL as matchedAlias, country_code as countryCode, scale, population, latitude, longitude, timezone, 1 as tier
      FROM cities
      WHERE scale = ? AND normalized_name LIKE ? AND normalized_name != ?

      UNION ALL

      -- Tier 2: Official name contains query at word boundary
      SELECT id, name, NULL as matchedAlias, country_code as countryCode, scale, population, latitude, longitude, timezone, 2 as tier
      FROM cities
      WHERE scale = ? AND normalized_name LIKE ? AND normalized_name NOT LIKE ?

      UNION ALL

      -- Tier 3: Canonical alias exact match (e.g. "Londres" for London)
      SELECT c.id, c.name, a.alias as matchedAlias, c.country_code as countryCode, c.scale, c.population, c.latitude, c.longitude, c.timezone, 3 as tier
      FROM city_aliases a
      JOIN cities c ON a.city_id = c.id
      WHERE a.scale = ? AND a.normalized_alias = ? AND c.normalized_name != ?

      UNION ALL

      -- Tier 4: Canonical alias starts with query
      SELECT c.id, c.name, a.alias as matchedAlias, c.country_code as countryCode, c.scale, c.population, c.latitude, c.longitude, c.timezone, 4 as tier
      FROM city_aliases a
      JOIN cities c ON a.city_id = c.id
      WHERE a.scale = ? AND a.normalized_alias LIKE ? AND a.normalized_alias != ? AND c.normalized_name NOT LIKE ?
    )
    SELECT id, name, matchedAlias, countryCode, scale, population, latitude, longitude, timezone, min(tier) as best_tier
    FROM matches
    GROUP BY id
    ORDER BY best_tier ASC, population DESC
    LIMIT ?
  `);

  let rows = stmt.all(
    scale, norm,
    scale, startsWith, norm,
    scale, contains, startsWith,
    scale, norm, norm,
    scale, startsWith, norm, startsWith,
    limit
  ) as unknown as (City & { matchedAlias?: string })[];

  // 2. Fuzzy typo-tolerance fallback (if 0 direct results and query has >= 4 chars)
  if (rows.length === 0 && norm.length >= 4) {
    const maxDist = norm.length >= 8 ? 2 : 1;
    const fuzzyStmt = db.prepare(`
      WITH fuzzy_matches AS (
        SELECT id, name, NULL as matchedAlias, country_code as countryCode, scale, population, latitude, longitude, timezone,
               levenshtein(normalized_name, ?) as dist
        FROM cities
        WHERE scale = ? AND levenshtein(normalized_name, ?) <= ?

        UNION ALL

        SELECT c.id, c.name, a.alias as matchedAlias, c.country_code as countryCode, c.scale, c.population, c.latitude, c.longitude, c.timezone,
               levenshtein(a.normalized_alias, ?) as dist
        FROM city_aliases a
        JOIN cities c ON a.city_id = c.id
        WHERE a.scale = ? AND levenshtein(a.normalized_alias, ?) <= ?
      )
      SELECT id, name, matchedAlias, countryCode, scale, population, latitude, longitude, timezone, min(dist) as best_dist
      FROM fuzzy_matches
      GROUP BY id
      ORDER BY best_dist ASC, population DESC
      LIMIT ?
    `);

    rows = fuzzyStmt.all(
      norm, scale, norm, maxDist,
      norm, scale, norm, maxDist,
      limit
    ) as unknown as (City & { matchedAlias?: string })[];
  }

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
 * Supports continent filtering for custom world scale.
 * - Europe: all prominent European cities >= 200,000 inhabitants (330 cities).
 * - France: top 80 major regional centers (>= ~60,000 inhabitants).
 * - World (all continents): balanced stratified pool of 138 world-class metropolises across all 6 continents (Method 2).
 * - World (specific continent): top 100 metropolises for that continent.
 */
export function getSeedCities(scale: GameScale, continent?: string): City[] {
  const db = getDb();
  if (scale === "world" && continent) {
    const stmt = db.prepare(`
      SELECT id, name, country_code as countryCode, scale, population, latitude, longitude, timezone
      FROM cities
      WHERE scale = ? AND continent = ?
      ORDER BY population DESC
      LIMIT 100
    `);
    return stmt.all(scale, continent) as unknown as City[];
  }

  if (scale === "world") {
    // Stratified continent sampling (Method 2):
    // Quotas: 25 EU, 25 NA, 25 SA, 25 AF, 30 AS, 8 OC = 138 iconic metropolises worldwide
    // Excludes NYC boroughs (Brooklyn, Queens, etc.) to keep single NYC center
    const stmt = db.prepare(`
      WITH ranked AS (
        SELECT id, name, country_code as countryCode, scale, continent, population, latitude, longitude, timezone,
               ROW_NUMBER() OVER (PARTITION BY continent ORDER BY population DESC) as rn
        FROM cities
        WHERE scale = 'world' AND name NOT IN ('Brooklyn', 'Queens', 'Manhattan', 'The Bronx', 'Staten Island')
      )
      SELECT id, name, countryCode, scale, population, latitude, longitude, timezone
      FROM ranked
      WHERE (continent = 'EU' AND rn <= 25)
         OR (continent = 'NA' AND rn <= 25)
         OR (continent = 'SA' AND rn <= 25)
         OR (continent = 'AF' AND rn <= 25)
         OR (continent = 'AS' AND rn <= 30)
         OR (continent = 'OC' AND rn <= 8)
      ORDER BY population DESC
    `);
    return stmt.all() as unknown as City[];
  }

  if (scale === "eu") {
    const stmt = db.prepare(`
      SELECT id, name, country_code as countryCode, scale, population, latitude, longitude, timezone
      FROM cities
      WHERE scale = 'eu' AND population >= 200000
      ORDER BY population DESC
    `);
    return stmt.all() as unknown as City[];
  }

  // France: top 80 major regional centers
  const stmt = db.prepare(`
    SELECT id, name, country_code as countryCode, scale, population, latitude, longitude, timezone
    FROM cities
    WHERE scale = ?
    ORDER BY population DESC
    LIMIT 80
  `);
  return stmt.all(scale) as unknown as City[];
}
