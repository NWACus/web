import { geocodeAddress, type AddressParts, type GeocodeResult } from '@/services/geocodio'
import { isRecord } from '@/utilities/isRecord'
import type { FieldHook } from 'payload'
import type { GeocodeStatus } from '../coordinatesField'

type Coordinates = {
  latitude?: number | null
  longitude?: number | null
  geocodeStatus?: GeocodeStatus | null
}

/** A location group as saved, with every field present and strings trimmed. */
type Location = Required<{ [K in keyof AddressParts]: string }> & {
  isVirtual: boolean
  coordinates: Required<Coordinates>
}

export type GeocodePlan = 'keep' | 'mark-manual' | 'geocode'

const STATUSES: ReadonlySet<unknown> = new Set(['geocoded', 'approximate', 'manual', 'failed'])
const isStatus = (value: unknown): value is GeocodeStatus => STATUSES.has(value)
const asText = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
const asNumber = (value: unknown) => (typeof value === 'number' ? value : null)

function readCoordinates(value: unknown): Required<Coordinates> {
  const group = isRecord(value) ? value : {}
  return {
    latitude: asNumber(group.latitude),
    longitude: asNumber(group.longitude),
    geocodeStatus: isStatus(group.geocodeStatus) ? group.geocodeStatus : null,
  }
}

function readLocation(value: unknown): Location {
  const group = isRecord(value) ? value : {}
  return {
    isVirtual: group.isVirtual === true,
    address: asText(group.address),
    city: asText(group.city),
    state: asText(group.state),
    zip: asText(group.zip),
    coordinates: readCoordinates(group.coordinates),
  }
}

const hasPoint = (c?: Coordinates | null) =>
  typeof c?.latitude === 'number' && typeof c?.longitude === 'number'

const addressOf = ({ address, city, state, zip }: Location) => [address, city, state, zip].join('|')

/**
 * Decides what a save does to the point. Coordinates the editor changed win over the address;
 * an address change re-geocodes, even over a hand-placed pin, because that pin was for the old address.
 */
export function planGeocode(value: unknown, previousValue: unknown): GeocodePlan {
  const next = readLocation(value)
  const previous = readLocation(previousValue)
  if (next.isVirtual) return 'keep'

  const now = next.coordinates
  const before = previous.coordinates
  const pointEdited = now.latitude !== before.latitude || now.longitude !== before.longitude
  if (pointEdited && hasPoint(now)) {
    // The admin picker sets a status alongside the point; typed or API-sent coordinates don't.
    return now.geocodeStatus === before.geocodeStatus ? 'mark-manual' : 'keep'
  }

  if (addressOf(next) !== addressOf(previous)) return 'geocode'
  return hasPoint(now) || now.geocodeStatus ? 'keep' : 'geocode'
}

/** The coordinates a geocode result leaves behind, or null to leave them untouched. */
export function coordinatesFromResult(
  result: GeocodeResult,
  previous?: Coordinates | null,
): Coordinates | null {
  if (result.status === 'unavailable') return null
  if (result.status === 'found') {
    return {
      latitude: result.latitude,
      longitude: result.longitude,
      geocodeStatus: result.precision === 'exact' ? 'geocoded' : 'approximate',
    }
  }
  // Keep a hand-placed pin when the edited address can't be found; it's still the editor's best answer.
  if (previous?.geocodeStatus === 'manual' && hasPoint(previous)) return previous
  return { latitude: null, longitude: null, geocodeStatus: 'failed' }
}

export const geocodeLocation: FieldHook = async ({ value, previousValue, req }) => {
  if (!isRecord(value)) return value
  const plan = planGeocode(value, previousValue)
  if (plan === 'keep') return value

  const next = readLocation(value)
  if (plan === 'mark-manual') {
    return { ...value, coordinates: { ...next.coordinates, geocodeStatus: 'manual' } }
  }

  const result = await geocodeAddress(next)
  if (result.status === 'unavailable') {
    req.payload.logger.warn(`Skipped geocoding an event location: ${result.reason}`)
  }
  const coordinates = coordinatesFromResult(result, readLocation(previousValue).coordinates)
  return coordinates ? { ...value, coordinates } : value
}
