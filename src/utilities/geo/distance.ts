import { distance } from '@turf/distance'
import { degreesToRadians, lengthToRadians, radiansToDegrees } from '@turf/helpers'

export type LatLng = { latitude: number; longitude: number }

/** Coordinates as Payload returns them: either may be unset. */
export type StoredCoordinates = { latitude?: number | null; longitude?: number | null }

export type BoundingBox = { south: number; north: number; west: number; east: number }

/** Great-circle distance; Turf takes points as [longitude, latitude]. */
export const distanceKm = (a: LatLng, b: LatLng) =>
  distance([a.longitude, a.latitude], [b.longitude, b.latitude], { units: 'kilometers' })

/**
 * The smallest lat/lng box that contains every point within `radiusKm` of `center`, so a database
 * can narrow on two indexed number columns before the exact distance check.
 * Boxes that would cross the antimeridian are not split; no avalanche center is near it.
 */
export function boundingBox(center: LatLng, radiusKm: number): BoundingBox {
  // Turf's Earth radius, so this box and distanceKm agree on where the circle's edge is.
  const angularRadius = lengthToRadians(radiusKm, 'kilometers')
  const lat = degreesToRadians(center.latitude)
  const south = radiansToDegrees(lat - angularRadius)
  const north = radiansToDegrees(lat + angularRadius)

  if (south <= -90 || north >= 90) {
    return { south: Math.max(south, -90), north: Math.min(north, 90), west: -180, east: 180 }
  }

  const dLng = radiansToDegrees(Math.asin(Math.sin(angularRadius) / Math.cos(lat)))
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

/**
 * Every doc, nearest first. Docs without a point follow in their original order, so a list
 * sorted by distance still shows virtual and unplaced items, after the placed ones.
 */
export function nearestFirst<T>(
  docs: T[],
  center: LatLng,
  getCoordinates: (doc: T) => StoredCoordinates | null | undefined,
): T[] {
  const placed = rankByDistance(docs, center, Infinity, getCoordinates).map(({ doc }) => doc)
  const unplaced = docs.filter((doc) => !toLatLng(getCoordinates(doc)))
  return [...placed, ...unplaced]
}
