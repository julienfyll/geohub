/**
 * Haversine and Geodesic Spatial Geometry Utilities
 */

const EARTH_RADIUS_KM = 6371.0088;

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
  points: number = 64
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

    // Normalize longitude between -180 and 180
    const normalizedLon = ((toDeg(lon) + 540) % 360) - 180;
    coordinates.push([normalizedLon, toDeg(lat)]);
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
 * Computes bounding box [minLon, minLat, maxLon, maxLat] for a center + radius
 */
export function getBoundingBox(
  lat: number,
  lon: number,
  radiusKm: number
): [number, number, number, number] {
  // Approximate delta in degrees with margin
  const deltaLat = (radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI) * 1.15;
  const deltaLon =
    (radiusKm / (EARTH_RADIUS_KM * Math.cos((lat * Math.PI) / 180))) *
    (180 / Math.PI) *
    1.15;

  return [lon - deltaLon, lat - deltaLat, lon + deltaLon, lat + deltaLat];
}
