/**
 * The observation viewer's data endpoints, shared by the observation and avalanche routes beside
 * this file. The viewer is a client component (Mapbox), and its list is restricted to the map's
 * viewport, so it fetches through these rather than receiving data from its static page.
 *
 * Proxying rather than letting the browser call the obs API directly is deliberate, and the reason
 * is the `Origin` allowlist: it accepts `*.avy-fx.org` but not a Vercel preview hostname, so a
 * browser-side call would fail on every preview deploy. Going through the server also keeps the
 * filter encoding, the zod validation and the HTML sanitizing server-side, and puts the e2e mock
 * seam in the Node process where MSW can reach it — the same reasons as `/api/[center]/danger-map`.
 */
import { loadDetail } from '@/components/observations/detail/loadDetail'
import { todayInTimezone } from '@/services/nac/forecastArchive'
import type { ObservationKind } from '@/services/nac/model/observation'
import {
  avalancheCard,
  observationCard,
  type ObservationListResponse,
} from '@/services/nac/observations/cards'
import { readFilters, readListState } from '@/services/nac/observations/filters'
import type { BBox, ListRequest } from '@/services/nac/observations/listParams'
import { isObservationId } from '@/services/nac/observations/routes'
import { getObservationSource } from '@/services/nac/sources'
import { NO_STORE, unknownCenterResponse } from '@/utilities/apiResponses'
import { centerTimezone, isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { NextRequest, NextResponse } from 'next/server'

/**
 * A viewport's worth of list, or a tile, is shared across readers looking at the same thing for a
 * minute — the upstream list reads a live view for recent records, so this is as fresh as the
 * widget's own per-pan requests while absorbing bursts.
 */
const SHARED_MINUTE = { 'Cache-Control': 'public, max-age=0, s-maxage=60' }
/** Upstream caches its 204s for ten seconds; a record that was just published should appear soon. */
const SHARED_BRIEFLY = { 'Cache-Control': 'public, max-age=0, s-maxage=10' }

/** `YYYY-MM-DD`. */
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/
/** Web Mercator tiles stop at zoom 24. */
const MAX_TILE_ZOOM = 24

type CenterParams = { params: Promise<{ center: string }> }

function badRequest(error: string): NextResponse {
  return NextResponse.json({ error }, { status: 400, headers: NO_STORE })
}

function unavailable(error: string): NextResponse {
  return NextResponse.json({ error }, { status: 502, headers: NO_STORE })
}

function notFound(): NextResponse {
  return NextResponse.json({ error: 'Not found' }, { status: 404, headers: SHARED_BRIEFLY })
}

/** `west,south,east,north`, four finite numbers, or null. */
function readBBox(raw: string | null): BBox | null {
  if (!raw) return null
  const parts = raw.split(',').map(Number)
  if (parts.length !== 4 || !parts.every(Number.isFinite)) return null
  const [west, south, east, north] = parts
  return [west, south, east, north]
}

async function fetchCards(center: string, request: ListRequest): Promise<ObservationListResponse> {
  const source = getObservationSource()
  if (request.kind === 'observation') {
    const page = await source.listObservations(center, { ...request, kind: 'observation' })
    return { ...page, items: page.items.map(observationCard) }
  }
  const page = await source.listAvalanches(center, { ...request, kind: 'avalanche' })
  return { ...page, items: page.items.map(avalancheCard) }
}

function readListRequest(kind: ObservationKind, request: NextRequest, center: string) {
  const bbox = readBBox(request.nextUrl.searchParams.get('bbox'))
  if (!bbox) return null
  const search = request.nextUrl.search
  const today = todayInTimezone(centerTimezone(center))
  const listRequest: ListRequest = {
    kind,
    filters: readFilters(search, today),
    bbox,
    list: readListState(search),
  }
  return listRequest
}

/**
 * The API answers a page past the end with a 500, which a shared `?page=` link reaches once the
 * matches have thinned out; that retries as page 1 (and says so in `page`) rather than erroring.
 */
async function cardsOrFirstPage(center: string, request: ListRequest) {
  try {
    return await fetchCards(center, request)
  } catch (error) {
    if (request.list.page === 1) throw error
    return fetchCards(center, { ...request, list: { ...request.list, page: 1 } })
  }
}

/**
 * One page of a tab's cards. The filters arrive in the viewer's own URL form (`filters.ts`), with
 * the dates always explicit, plus the viewport as `bbox`.
 */
export function listHandler(kind: ObservationKind) {
  return async function GET(request: NextRequest, { params }: CenterParams) {
    const { center } = await params
    if (!isValidTenantSlug(center)) return unknownCenterResponse()
    const listRequest = readListRequest(kind, request, center)
    if (!listRequest) return badRequest('A bbox is required')

    try {
      const body = await cardsOrFirstPage(center, listRequest)
      return NextResponse.json(body, { headers: SHARED_MINUTE })
    } catch {
      return unavailable('Observations unavailable')
    }
  }
}

type TileParams = { params: Promise<{ center: string; z: string; x: string; y: string }> }

function tileCoordinate(raw: string, max = Infinity): number | null {
  const value = Number(raw)
  return Number.isInteger(value) && value >= 0 && value <= max ? value : null
}

/** The tile's coordinates (Mapbox asks for `{y}` bare; an `.mvt` suffix is tolerated). */
function readTile(raw: { z: string; x: string; y: string }) {
  const z = tileCoordinate(raw.z, MAX_TILE_ZOOM)
  const x = tileCoordinate(raw.x)
  // Drops a trailing `.mvt` from the y segment.
  const y = tileCoordinate(raw.y.replace(/\.mvt$/, ''))
  return z === null || x === null || y === null ? null : { z, x, y }
}

function readDates(request: NextRequest) {
  const param = (key: string) => request.nextUrl.searchParams.get(key) ?? ''
  const from = param('startDate')
  const to = param('endDate')
  return ISO_DAY.test(from) && ISO_DAY.test(to) ? { from, to } : null
}

function tileResponse(tile: ArrayBuffer | null): NextResponse {
  if (!tile) return new NextResponse(null, { status: 204, headers: SHARED_MINUTE })
  return new NextResponse(tile, {
    headers: { ...SHARED_MINUTE, 'Content-Type': 'application/vnd.mapbox-vector-tile' },
  })
}

async function respondWithTile(
  center: string,
  kind: ObservationKind,
  tile: { z: number; x: number; y: number },
  dates: { from: string; to: string },
): Promise<NextResponse> {
  try {
    return tileResponse(await getObservationSource().getTile(center, kind, tile, dates))
  } catch {
    return unavailable('Tile unavailable')
  }
}

/**
 * A vector tile of one tab's markers, for the dates the URL carries — the obs API's tiles filter
 * on dates alone, and the map applies every other filter itself (`tileFilter`).
 */
export function tileHandler(kind: ObservationKind) {
  return async function GET(request: NextRequest, { params }: TileParams) {
    const { center, ...coordinates } = await params
    if (!isValidTenantSlug(center)) return unknownCenterResponse()
    const tile = readTile(coordinates)
    const dates = readDates(request)
    if (!tile || !dates) return badRequest('Tile coordinates and both dates are required')
    return respondWithTile(center, kind, tile, dates)
  }
}

type DetailParams = { params: Promise<{ center: string; id: string }> }

async function respondWithDetail(
  center: string,
  kind: ObservationKind,
  id: string,
): Promise<NextResponse> {
  try {
    const detail = await loadDetail(center, kind, id)
    return detail ? NextResponse.json(detail, { headers: SHARED_MINUTE }) : notFound()
  } catch {
    return unavailable('Observation unavailable')
  }
}

/**
 * One record, prepared for the detail components, for the modal over the list. A record the API
 * has no public copy of (missing, draft, private) is a 404 the modal words as "not found"; a
 * failure is a 502 it words as "couldn't load".
 */
export function detailHandler(kind: ObservationKind) {
  return async function GET(_request: NextRequest, { params }: DetailParams) {
    const { center, id } = await params
    if (!isValidTenantSlug(center)) return unknownCenterResponse()
    if (!isObservationId(id)) return notFound()
    return respondWithDetail(center, kind, id)
  }
}
