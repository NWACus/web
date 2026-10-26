import type { PolygonGeometry, Position } from './pointInPolygon'

/** `[[west, south], [east, north]]` — the shape Mapbox's `fitBounds` takes. */
export type Bounds = [[number, number], [number, number]]

function positionsOf(geometry: PolygonGeometry): Position[] {
  const rings = geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat()
  return rings.flat()
}

/** The box around a set of polygons, or null when there is nothing to frame. */
export function boundsOfGeometries(geometries: PolygonGeometry[]): Bounds | null {
  const positions = geometries.flatMap(positionsOf)
  if (positions.length === 0) return null

  return positions.reduce<Bounds>(
    ([[west, south], [east, north]], [lng, lat]) => [
      [Math.min(west, lng), Math.min(south, lat)],
      [Math.max(east, lng), Math.max(north, lat)],
    ],
    [
      [Infinity, Infinity],
      [-Infinity, -Infinity],
    ],
  )
}
