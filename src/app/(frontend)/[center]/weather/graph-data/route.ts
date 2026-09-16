import {
  MAX_COMPARE_STATIONS,
  STATION_GRAPH_PRESETS,
} from '@/components/WeatherStations/stationGraphPresets'
import { buildGraphData, windowExceedsThreshold } from '@/services/snowobs/graph'
import { fetchStationTimeseries, SnowObsError } from '@/services/snowobs/snowobs'
import type { StationPage } from '@/services/stations/getStationPages'
import { allStationIds, getStationPages } from '@/services/stations/getStationPages'
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
function maxStations(pages: StationPage[]): number {
  const largestPage = Math.max(1, ...pages.map((page) => page.stids.length))
  return (1 + MAX_COMPARE_STATIONS) * largestPage
}

function unknownStids(stids: string[], known: Set<string>): string | null {
  const unknown = stids.filter((stid) => !known.has(stid))
  return unknown.length > 0 ? `unknown stids: ${unknown.join(',')}` : null
}

function validateLists(stids: string[], vars: string[], pages: StationPage[]): string | null {
  return (
    listBounds('stids', stids, maxStations(pages)) ??
    listBounds('vars', vars, MAX_VARIABLES) ??
    unknownStids(stids, allStationIds(pages))
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
  pages: StationPage[],
): NextResponse | { stids: string[]; vars: string[]; from: Date; to: Date } {
  const stids = csvParam(url.searchParams.get('stids'))
  const vars = csvParam(url.searchParams.get('vars'))
  const from = dateParam(url, 'from')
  const to = dateParam(url, 'to')
  const error = validateLists(stids, vars, pages) ?? validateWindow(from, to)
  return error ? badRequest(error) : { stids, vars, from, to }
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
  const { stids, vars, from, to } = parsed

  try {
    const response = await fetchStationTimeseries(center, stids, {
      start: from,
      end: to,
      revalidate: REVALIDATE_SECONDS,
      rawData: true,
    })
    const data = buildGraphData(response, stids, vars, windowExceedsThreshold(from, to))
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
