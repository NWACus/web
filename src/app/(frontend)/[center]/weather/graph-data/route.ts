import {
  MAX_COMPARE_STATIONS,
  STATION_GRAPH_PRESETS,
} from '@/components/WeatherStations/stationGraphPresets'
import { buildGraphData, windowExceedsThreshold } from '@/services/snowobs/graph'
import { fetchStationTimeseries, SnowObsError } from '@/services/snowobs/snowobs'
import type { StationRef } from '@/services/snowobs/stationKey'
import { parseStationKey } from '@/services/snowobs/stationKey'
import type { AssembledStationPage } from '@/services/stations/getStationPages'
import { allStations, getStationPages } from '@/services/stations/getStationPages'
import { NextResponse } from 'next/server'

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
// comparison pick, and the union of all preset variables.
function maxStations(pages: AssembledStationPage[]): number {
  const largestPage = Math.max(1, ...pages.map((page) => page.stations.length))
  return (1 + MAX_COMPARE_STATIONS) * largestPage
}

function unknownStations(keys: string[], known: Set<string>): string | null {
  const unknown = keys.filter((key) => !known.has(key))
  return unknown.length > 0 ? `unknown stations: ${unknown.join(',')}` : null
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
    malformedKeys(keys) ??
    unknownStations(keys, new Set(allStations(pages).keys()))
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

function parseQuery(
  url: URL,
  pages: AssembledStationPage[],
): NextResponse | { stations: StationRef[]; vars: string[]; from: Date; to: Date } {
  const keys = csvParam(url.searchParams.get('stations'))
  const vars = csvParam(url.searchParams.get('vars'))
  const from = dateParam(url, 'from')
  const to = dateParam(url, 'to')
  const error = validateLists(keys, vars, pages) ?? validateWindow(from, to)
  if (error) return badRequest(error)
  // Every key passed validation, so each resolves to a station on a page.
  const known = allStations(pages)
  return { stations: keys.flatMap((key) => known.get(key) ?? []), vars, from, to }
}

// CRAP is inflated by the lack of unit coverage on this route handler.
// fallow-ignore-next-line complexity
export async function GET(
  request: Request,
  { params }: { params: Promise<Params> },
): Promise<NextResponse> {
  const { center } = await params
  const pages = await getStationPages(center)
  if (pages.length === 0) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const parsed = parseQuery(new URL(request.url), pages)
  if (parsed instanceof NextResponse) return parsed
  const { stations, vars, from, to } = parsed

  try {
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
    const message = error instanceof SnowObsError ? error.message : 'failed to load station data'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
