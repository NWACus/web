import {
  MAX_COMPARE_STATIONS,
  STATION_GRAPH_PRESETS,
} from '@/components/WeatherStations/stationGraphPresets'
import { buildGraphData, windowExceedsThreshold } from '@/services/snowobs/graph'
import { fetchStationTimeseries } from '@/services/snowobs/snowobs'
import type { StationRef } from '@/services/snowobs/stationKey'
import { parseStationKey } from '@/services/snowobs/stationKey'
import { unknownStationKeys } from '@/services/snowobs/trackedStations'
import type { AssembledStationPage } from '@/services/stations/getStationPages'
import { allStations, getStationPages } from '@/services/stations/getStationPages'
import { unknownCenterResponse } from '@/utilities/apiResponses'
import { isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import config from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

// Serves the station Graphs tab. Reads SnowObs server-side (token stays
// hidden); windows longer than 30 days aggregate to daily min/mean/max.

const MAX_VARIABLES = new Set(STATION_GRAPH_PRESETS.flatMap((p) => p.variables)).size
const MAX_WINDOW_MS = 5 * 366 * 24 * 60 * 60 * 1000 // ~5 years, verified against SnowObs
const REVALIDATE_SECONDS = 300

type Params = { center: string }

function csvParam(value: string | null): string[] {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 })
}

function listBounds(name: string, values: string[], max: number): string | null {
  return values.length === 0 || values.length > max ? `${name} must list 1-${max} entries` : null
}

// Caps sized to the Graphs tab's single fetch: the page's stations plus every
// comparison pick, and the union of all preset variables. A detail page's one
// station plus its picks fits the same cap, even for a center with no pages.
function maxStations(pages: AssembledStationPage[]): number {
  const largestPage = Math.max(1, ...pages.map((page) => page.stations.length))
  return (1 + MAX_COMPARE_STATIONS) * largestPage
}

function malformedKeys(keys: string[]): string | null {
  return keys.some((key) => parseStationKey(key) === null)
    ? 'stations must be source:stid pairs'
    : null
}

function validateLists(
  keys: string[],
  vars: string[],
  pages: AssembledStationPage[],
): string | null {
  return (
    listBounds('stations', keys, maxStations(pages)) ??
    listBounds('vars', vars, MAX_VARIABLES) ??
    malformedKeys(keys)
  )
}

function isValidRange(from: Date, to: Date): boolean {
  return Number.isFinite(from.getTime()) && Number.isFinite(to.getTime()) && from < to
}

function validateWindow(from: Date, to: Date): string | null {
  if (!isValidRange(from, to)) return 'from/to must be valid dates with from < to'
  return to.getTime() - from.getTime() > MAX_WINDOW_MS ? 'window exceeds the 5-year maximum' : null
}

function dateParam(url: URL, name: string): Date {
  return new Date(url.searchParams.get(name) ?? '')
}

type GraphQuery = { keys: string[]; stations: StationRef[]; vars: string[]; from: Date; to: Date }

function parseQuery(url: URL, pages: AssembledStationPage[]): NextResponse | GraphQuery {
  const keys = csvParam(url.searchParams.get('stations'))
  const vars = csvParam(url.searchParams.get('vars'))
  const from = dateParam(url, 'from')
  const to = dateParam(url, 'to')
  const error = validateLists(keys, vars, pages) ?? validateWindow(from, to)
  if (error) return badRequest(error)
  // Every key passed validation, so each parses.
  return { keys, stations: keys.flatMap((key) => parseStationKey(key) ?? []), vars, from, to }
}

// A station page's own stations pass without a SnowObs read; anything else,
// such as a single station's detail page, must be one the center tracks.
async function unknownStations(
  center: string,
  keys: string[],
  pages: AssembledStationPage[],
): Promise<NextResponse | null> {
  const onPages = new Set(allStations(pages).keys())
  const unknown = await unknownStationKeys(center, keys, onPages)
  return unknown.length > 0 ? badRequest(`unknown stations: ${unknown.join(',')}`) : null
}

// Generic, as precip-data's is: a missing token or a SnowObs fault is ours to read in the log.
async function upstreamError(center: string, error: unknown): Promise<NextResponse> {
  const payload = await getPayload({ config })
  payload.logger.error({ err: error, center }, 'graph-data failed')
  return NextResponse.json({ error: 'failed to load station data' }, { status: 502 })
}

// CRAP is inflated by the lack of unit coverage on this route handler.
// fallow-ignore-next-line complexity
export async function GET(
  request: Request,
  { params }: { params: Promise<Params> },
): Promise<NextResponse> {
  const { center } = await params
  if (!isValidTenantSlug(center)) return unknownCenterResponse()
  const pages = await getStationPages(center)

  const parsed = parseQuery(new URL(request.url), pages)
  if (parsed instanceof NextResponse) return parsed
  const { keys, stations, vars, from, to } = parsed

  try {
    const rejected = await unknownStations(center, keys, pages)
    if (rejected) return rejected
    const response = await fetchStationTimeseries(center, stations, {
      start: from,
      end: to,
      revalidate: REVALIDATE_SECONDS,
      rawData: true,
    })
    const data = buildGraphData(center, response, stations, vars, windowExceedsThreshold(from, to))
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=60`,
      },
    })
  } catch (error) {
    return upstreamError(center, error)
  }
}
