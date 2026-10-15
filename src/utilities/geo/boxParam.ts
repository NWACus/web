import type { BoundingBox } from './distance'

/** A box as a `bbox` URL param: `west,south,east,north`, the order GeoJSON and Mapbox use. */
export function formatBoxParam({ west, south, east, north }: BoundingBox): string {
  // Four decimals is about 10 m: plenty for a map view, short enough for a shareable URL. Rounding
  // outward keeps a pin on the very edge of the view inside the box.
  const round = (degrees: number, toward: (value: number) => number) =>
    (toward(degrees * 1e4) / 1e4).toFixed(4)
  return [
    round(west, Math.floor),
    round(south, Math.floor),
    round(east, Math.ceil),
    round(north, Math.ceil),
  ].join(',')
}

/** The box a `bbox` URL param describes, or null when it is missing or malformed. */
export function parseBoxParam(value: string | null | undefined): BoundingBox | null {
  // Blank parts are malformed, not zero: `Number('')` is 0.
  const parts = value?.split(',').map((part) => (part.trim() ? Number(part) : NaN)) ?? []
  if (parts.length !== 4 || !parts.every(Number.isFinite)) return null
  const [west = 0, south = 0, east = 0, north = 0] = parts
  const inRange = south >= -90 && north <= 90 && west >= -180 && east <= 180
  if (!inRange || south > north || west > east) return null
  return { west, south, east, north }
}
