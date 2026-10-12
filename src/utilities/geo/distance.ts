export type LatLng = { latitude: number; longitude: number }

/** Coordinates as Payload returns them: either may be unset. */
export type StoredCoordinates = { latitude?: number | null; longitude?: number | null }

export type BoundingBox = { south: number; north: number; west: number; east: number }

const EARTH_RADIUS_KM = 6371.0088

const toRadians = (degrees: number) => (degrees * Math.PI) / 180
const toDegrees = (radians: number) => (radians * 180) / Math.PI

/** Great-circle distance between two points. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.latitude - a.latitude)
  const dLng = toRadians(b.longitude - a.longitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * The smallest lat/lng box that contains every point within `radiusKm` of `center`, so a database
 * can narrow on two indexed number columns before the exact distance check.
 * Boxes that would cross the antimeridian are not split; no avalanche center is near it.
 */
export function boundingBox(center: LatLng, radiusKm: number): BoundingBox {
  const angularRadius = radiusKm / EARTH_RADIUS_KM
  const lat = toRadians(center.latitude)
  const south = toDegrees(lat - angularRadius)
  const north = toDegrees(lat + angularRadius)

  if (south <= -90 || north >= 90) {
    return { south: Math.max(south, -90), north: Math.min(north, 90), west: -180, east: 180 }
  }

  const dLng = toDegrees(Math.asin(Math.sin(angularRadius) / Math.cos(lat)))
  return {
    south,
    north,
    west: Math.max(center.longitude - dLng, -180),
    east: Math.min(center.longitude + dLng, 180),
  }
}

/**
 * Keeps the docs inside the radius, nearest first, each tagged with its distance.
 * Docs without coordinates are dropped.
 */
export function rankByDistance<T>(
  docs: T[],
  center: LatLng,
  radiusKm: number,
  getCoordinates: (doc: T) => StoredCoordinates | null | undefined,
): Array<{ doc: T; distanceKm: number }> {
  return docs
    .flatMap((doc) => {
      const coordinates = getCoordinates(doc)
      if (typeof coordinates?.latitude !== 'number' || typeof coordinates.longitude !== 'number') {
        return []
      }
      const distanceKm = haversineKm(center, {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      })
      return distanceKm <= radiusKm ? [{ doc, distanceKm }] : []
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
}
