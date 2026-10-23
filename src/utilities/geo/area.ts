import { bbox } from '@turf/bbox'
import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon'
import type { MultiPolygon, Polygon } from 'geojson'
import { toLatLng, type BoundingBox, type StoredCoordinates } from './distance'

/** A drawn area as GeoJSON: one polygon, or several (holes allowed in either). */
export type GeoArea = Polygon | MultiPolygon

/** The smallest lat/lng box around the area, for narrowing in the database first. */
export function areaBounds(area: GeoArea): BoundingBox {
  const box = bbox(area)
  // GeoJSON bboxes are [west, south, east, north], or six values when they carry altitude.
  const [west, south, east, north] = box.length === 4 ? box : [box[0], box[1], box[3], box[4]]
  return { south, north, west, east }
}

/** Keeps the docs whose point is inside the area (or on its edge). Docs without coordinates are dropped. */
export function keepInsideArea<T>(
  docs: T[],
  area: GeoArea,
  getCoordinates: (doc: T) => StoredCoordinates | null | undefined,
): T[] {
  return docs.filter((doc) => {
    const point = toLatLng(getCoordinates(doc))
    return point !== null && booleanPointInPolygon([point.longitude, point.latitude], area)
  })
}
