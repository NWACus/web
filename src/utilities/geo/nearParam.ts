import type { LatLng } from './distance'

/**
 * A point as a `near` URL param: `latitude,longitude`. Four decimals (about 10 m) suits a place
 * the reader typed; a device's location is rounded further before it leaves the browser.
 */
export function formatNearParam({ latitude, longitude }: LatLng, decimals = 4): string {
  return `${latitude.toFixed(decimals)},${longitude.toFixed(decimals)}`
}

/** The point a `near` URL param describes, or null when it is missing or malformed. */
export function parseNearParam(value: string | null | undefined): LatLng | null {
  // Blank parts are malformed, not zero: `Number('')` is 0.
  const parts = value?.split(',').map((part) => (part.trim() ? Number(part) : NaN)) ?? []
  if (parts.length !== 2 || !parts.every(Number.isFinite)) return null
  const [latitude = 0, longitude = 0] = parts
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null
  return { latitude, longitude }
}
