import type { LatLng } from '@/utilities/geo/distance'
import { isRecord } from '@/utilities/isRecord'

export type AddressParts = {
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
}

/** `exact` lands on or in front of the parcel; `approximate` is a street, city or ZIP centroid. */
export type GeocodePrecision = 'exact' | 'approximate'

export type GeocodeResult =
  | ({ status: 'found'; precision: GeocodePrecision; accuracyType: string } & LatLng)
  | { status: 'no-match' }
  | { status: 'unavailable'; reason: string }

const GEOCODIO_URL = 'https://api.geocod.io/v2/geocode'

// Geocodio's accuracy score is 1.0 even for city centroids, so precision comes from the match type.
const EXACT_ACCURACY_TYPES = new Set([
  'rooftop',
  'point',
  'range_interpolation',
  'nearest_rooftop_match',
  'intersection',
])

/**
 * A one-line query, or null when the parts can't pin down a place: a street alone resolves to
 * whichever town has that street name.
 */
export function buildGeocodeQuery({ address, city, state, zip }: AddressParts): string | null {
  const clean = (value?: string | null) => value?.trim() || ''
  const [street, town, region, postal] = [clean(address), clean(city), clean(state), clean(zip)]
  if (!postal && !(town && region)) return null
  return [street, town, [region, postal].filter(Boolean).join(' ')].filter(Boolean).join(', ')
}

function firstResult(body: unknown) {
  if (!isRecord(body) || !Array.isArray(body.results)) return null
  const [result] = body.results
  if (!isRecord(result) || !isRecord(result.location)) return null
  const { lat, lng } = result.location
  if (typeof lat !== 'number' || typeof lng !== 'number') return null
  const accuracyType = typeof result.accuracy_type === 'string' ? result.accuracy_type : 'unknown'
  return { latitude: lat, longitude: lng, accuracyType }
}

/** Forward-geocodes a US address with Geocodio, whose results we're allowed to store. */
export async function geocodeAddress(
  parts: AddressParts,
  { apiKey = process.env.GEOCODIO_API_KEY }: { apiKey?: string } = {},
): Promise<GeocodeResult> {
  if (!apiKey) return { status: 'unavailable', reason: 'GEOCODIO_API_KEY is not set' }

  const query = buildGeocodeQuery(parts)
  if (!query) return { status: 'no-match' }

  const url = new URL(GEOCODIO_URL)
  url.searchParams.set('q', query)
  url.searchParams.set('country', 'US')
  url.searchParams.set('limit', '1')

  let response: Response
  try {
    // A header rather than `api_key=`, so the key stays out of logged request URLs.
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    })
  } catch (error) {
    return {
      status: 'unavailable',
      reason: error instanceof Error ? error.message : 'fetch failed',
    }
  }

  // 422 is Geocodio's "couldn't parse this address"; 429 and 5xx are worth retrying later.
  if (response.status === 422) return { status: 'no-match' }
  if (!response.ok)
    return { status: 'unavailable', reason: `Geocodio responded ${response.status}` }

  const match = firstResult(await response.json().catch(() => null))
  if (!match) return { status: 'no-match' }

  return {
    status: 'found',
    ...match,
    precision: EXACT_ACCURACY_TYPES.has(match.accuracyType) ? 'exact' : 'approximate',
  }
}
