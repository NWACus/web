/**
 * Point-in-polygon for GeoJSON polygons, by ray casting.
 *
 * The station map classifies each station into the forecast zone it sits in, which is how the
 * zone filter and the ordered station list work. The zones are plain GeoJSON polygons, so this is
 * the whole of the geometry the map needs — not enough to justify a dependency.
 *
 * Holes are honored: a point inside an inner ring is outside the polygon. Points exactly on an
 * edge are classified arbitrarily, as every ray-casting implementation does.
 */

/** A `[lng, lat]` pair; a third (elevation) value is ignored. */
export type Position = number[]

export type PolygonGeometry =
  | { type: 'Polygon'; coordinates: Position[][] }
  | { type: 'MultiPolygon'; coordinates: Position[][][] }

function pointInRing([x, y]: Position, ring: Position[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    const crosses = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (crosses) inside = !inside
  }
  return inside
}

function pointInPolygonRings(point: Position, rings: Position[][]): boolean {
  const [outer, ...holes] = rings
  if (!outer || !pointInRing(point, outer)) return false
  return !holes.some((hole) => pointInRing(point, hole))
}

export function pointInPolygon(point: Position, geometry: PolygonGeometry): boolean {
  if (geometry.type === 'Polygon') return pointInPolygonRings(point, geometry.coordinates)
  return geometry.coordinates.some((rings) => pointInPolygonRings(point, rings))
}
