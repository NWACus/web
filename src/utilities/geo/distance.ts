import { distance } from '@turf/distance'

export type LatLng = { latitude: number; longitude: number }

/** Coordinates as Payload returns them: either may be unset. */
export type StoredCoordinates = { latitude?: number | null; longitude?: number | null }

export type BoundingBox = { south: number; north: number; west: number; east: number }

// Turf's mean Earth radius, so the box below and Turf's distance check agree on the circle.
const EARTH_RADIUS_KM = 6371.0088

const toRadians = (degrees: number) => (degrees * Math.PI) / 180
const toDegrees = (radians: number) => (radians * 180) / Math.PI

/** Great-circle distance; Turf takes points as [longitude, latitude]. */
const distanceKm = (a: LatLng, b: LatLng) =>
  distance([a.longitude, a.latitude], [b.longitude, b.latitude], { units: 'kilometers' })

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

/** Stored coordinates as a point, or null when either half is missing. */
export function toLatLng(coordinates: StoredCoordinates | null | undefined): LatLng | null {
  const { latitude, longitude } = coordinates ?? {}
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null
  return { latitude, longitude }
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
      const point = toLatLng(getCoordinates(doc))
      if (!point) return []
      const km = distanceKm(center, point)
      return km <= radiusKm ? [{ doc, distanceKm: km }] : []
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
}
