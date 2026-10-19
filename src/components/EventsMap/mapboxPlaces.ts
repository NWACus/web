import type { LatLng } from '@/utilities/geo/distance'
import { z } from 'zod'

/**
 * Mapbox Search Box API: `/suggest` as the reader types, then one `/retrieve` for the pick. Both
 * share a session token, which Mapbox bills as one session. Results are only used to sort the
 * reader's own view, never stored, as Mapbox's terms require of these results.
 */
const SEARCH_API = 'https://api.mapbox.com/search/searchbox/v1'

// Towns, ZIPs and points of interest, which is where trailheads and ski areas live.
const PLACE_TYPES = 'place,locality,neighborhood,postcode,poi'

export type PlaceSuggestion = { id: string; name: string; context: string }

const suggestResponse = z.object({
  suggestions: z.array(
    z.object({ mapbox_id: z.string(), name: z.string(), place_formatted: z.string().optional() }),
  ),
})

const retrieveResponse = z.object({
  // At least one feature; the first is the pick.
  features: z
    .tuple([z.object({ geometry: z.object({ coordinates: z.tuple([z.number(), z.number()]) }) })])
    .rest(z.unknown()),
})

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

/** Whether there's a token to search with; without one, Mapbox turns every lookup away. */
export const placeSearchAvailable = TOKEN !== ''

function searchUrl(path: string, params: Record<string, string>): string {
  return `${SEARCH_API}/${path}?${new URLSearchParams({ ...params, access_token: TOKEN })}`
}

export async function suggestPlaces(
  query: string,
  sessionToken: string,
  signal: AbortSignal,
): Promise<PlaceSuggestion[]> {
  const url = searchUrl('suggest', {
    q: query,
    session_token: sessionToken,
    country: 'US',
    language: 'en',
    limit: '5',
    types: PLACE_TYPES,
  })
  const body = suggestResponse.parse(await fetch(url, { signal }).then((res) => res.json()))
  return body.suggestions.map(({ mapbox_id, name, place_formatted }) => ({
    id: mapbox_id,
    name,
    context: place_formatted ?? '',
  }))
}

export async function retrievePlace(id: string, sessionToken: string): Promise<LatLng> {
  const url = searchUrl(`retrieve/${encodeURIComponent(id)}`, { session_token: sessionToken })
  const body = retrieveResponse.parse(await fetch(url).then((res) => res.json()))
  const [longitude, latitude] = body.features[0].geometry.coordinates
  return { latitude, longitude }
}
