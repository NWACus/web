/**
 * Mapbox's Search Box API, as the widget's place search calls it: up to five US places, towns and
 * outdoor points of interest near the map's center, then the chosen one's coordinates.
 *
 * Plain `fetch` rather than `@mapbox/search-js-web`: loading that library on a page breaks the
 * legacy danger-map widget, and two calls don't need it.
 */
const SEARCH_BOX = 'https://api.mapbox.com/search/searchbox/v1'

export interface PlaceSuggestion {
  id: string
  name: string
  /** "Snoqualmie Pass Washington", as the widget lists a result's place and region. */
  context: string
  /** "WA", for the count line's "near Snoqualmie Pass, WA". */
  regionCode: string | null
}

export interface ChosenPlace {
  label: string
  center: [number, number]
}

interface SuggestionWire {
  mapbox_id: string
  name: string
  context?: { place?: { name?: string }; region?: { name?: string; region_code?: string } }
}

interface SuggestResponse {
  suggestions?: SuggestionWire[]
}

function upperOrNull(code: string | undefined): string | null {
  return code ? code.toUpperCase() : null
}

function toSuggestion(suggestion: SuggestionWire): PlaceSuggestion {
  const context = suggestion.context ?? {}
  const place = context.place ?? {}
  const region = context.region ?? {}
  return {
    id: suggestion.mapbox_id,
    name: suggestion.name,
    context: [place.name, region.name].filter(Boolean).join(' '),
    regionCode: upperOrNull(region.region_code),
  }
}

export async function suggestPlaces(
  query: string,
  proximity: [number, number] | null,
  token: string,
  session: string,
): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({
    q: query.trim(),
    access_token: token,
    session_token: session,
    limit: '5',
    types: 'place,city,poi',
    poi_category: 'mountain,tourist_attraction,outdoors,park,lake',
    country: 'US',
  })
  if (proximity) params.set('proximity', proximity.join(','))
  const res = await fetch(`${SEARCH_BOX}/suggest?${params}`)
  if (!res.ok) throw new Error(String(res.status))
  const body: SuggestResponse = await res.json()
  return (body.suggestions ?? []).map(toSuggestion)
}

interface RetrieveResponse {
  features?: { geometry?: { coordinates?: number[] } }[]
}

type RetrievedFeature = NonNullable<RetrieveResponse['features']>[number]

function featureCoordinates(feature: RetrievedFeature): number[] {
  return feature.geometry?.coordinates ?? []
}

function firstCoordinates(body: RetrieveResponse): number[] {
  const [feature] = body.features ?? []
  return feature ? featureCoordinates(feature) : []
}

function coordinatesOf(body: RetrieveResponse): [number, number] | null {
  const [lng, lat] = firstCoordinates(body)
  return typeof lng === 'number' && typeof lat === 'number' ? [lng, lat] : null
}

/** "Snoqualmie Pass, WA", for the count line's "near …". */
function placeLabel(suggestion: PlaceSuggestion): string {
  return suggestion.regionCode ? `${suggestion.name}, ${suggestion.regionCode}` : suggestion.name
}

export async function retrievePlace(
  suggestion: PlaceSuggestion,
  token: string,
  session: string,
): Promise<ChosenPlace | null> {
  const params = new URLSearchParams({ access_token: token, session_token: session })
  const res = await fetch(`${SEARCH_BOX}/retrieve/${encodeURIComponent(suggestion.id)}?${params}`)
  if (!res.ok) throw new Error(String(res.status))
  const center = coordinatesOf(await res.json())
  return center && { label: placeLabel(suggestion), center }
}
