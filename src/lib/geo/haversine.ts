/**
 * Haversine and Geodesic Spatial Geometry Utilities
 */

const EARTH_RADIUS_KM = 6371.0088;
const MAX_MERCATOR_LAT = 85.0511;

/**
 * Calculates the Great Circle / Haversine distance between two coordinates in kilometers.
 */
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Generates a GeoJSON Polygon representing a geodesic circle on the Earth.
 * Uses spherical trigonometry (bearing & angular distance) to ensure no Mercator distortion.
 */
export function createGeodesicCircle(
  centerLat: number,
  centerLon: number,
  radiusKm: number,
  points: number = 72
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coordinates: [number, number][] = [];
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const rLat = toRad(centerLat);
  const rLon = toRad(centerLon);
  const angularDist = radiusKm / EARTH_RADIUS_KM;

  for (let i = 0; i <= points; i++) {
    const bearing = (i * 360) / points;
    const rBearing = toRad(bearing);

    const lat = Math.asin(
      Math.sin(rLat) * Math.cos(angularDist) +
        Math.cos(rLat) * Math.sin(angularDist) * Math.cos(rBearing)
    );

    const lon =
      rLon +
      Math.atan2(
        Math.sin(rBearing) * Math.sin(angularDist) * Math.cos(rLat),
        Math.cos(angularDist) - Math.sin(rLat) * Math.sin(lat)
      );

    const degLat = Math.max(-MAX_MERCATOR_LAT, Math.min(MAX_MERCATOR_LAT, toDeg(lat)));
    const normalizedLon = ((toDeg(lon) + 540) % 360) - 180;
    coordinates.push([normalizedLon, degLat]);
  }

  return {
    type: "Feature",
    properties: {
      radiusKm,
    },
    geometry: {
      type: "Polygon",
      coordinates: [coordinates],
    },
  };
}

/**
 * Computes safe bounding box [minLon, minLat, maxLon, maxLat] for MapLibre fitBounds.
 * Guaranteed to respect Web Mercator bounds [-85.0511, 85.0511] and longitude limits.
 */
export function getBoundingBox(
  lat: number,
  lon: number,
  radiusKm: number
): [number, number, number, number] {
  // If radius is global (e.g. > 7000 km), return whole world bounds
  if (radiusKm >= 7000) {
    return [-175, -75, 175, 75];
  }

  const feat = createGeodesicCircle(lat, lon, radiusKm, 72);
  const coords = feat.geometry.coordinates[0];

  let minLon = 180;
  let maxLon = -180;
  let minLat = MAX_MERCATOR_LAT;
  let maxLat = -MAX_MERCATOR_LAT;

  for (const [pLon, pLat] of coords) {
    if (pLon < minLon) minLon = pLon;
    if (pLon > maxLon) maxLon = pLon;
    if (pLat < minLat) minLat = pLat;
    if (pLat > maxLat) maxLat = pLat;
  }

  // Margin padding
  const padLat = Math.min(5, (maxLat - minLat) * 0.1);
  const padLon = Math.min(5, (maxLon - minLon) * 0.1);

  const safeMinLat = Math.max(-MAX_MERCATOR_LAT, minLat - padLat);
  const safeMaxLat = Math.min(MAX_MERCATOR_LAT, maxLat + padLat);

  // Check if span crosses antimeridian
  let safeMinLon = Math.max(-179.9, minLon - padLon);
  let safeMaxLon = Math.min(179.9, maxLon + padLon);

  if (safeMinLon >= safeMaxLon) {
    safeMinLon = -179.9;
    safeMaxLon = 179.9;
  }

  return [safeMinLon, safeMinLat, safeMaxLon, safeMaxLat];
}
