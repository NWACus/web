import { STATION_GRAPH_PRESETS } from '@/components/WeatherStations/stationGraphPresets'
import {
  getStationRegistry,
  MAX_COMPARE_STATIONS,
  type StationRegistry,
} from '@/constants/weatherStations'
import { buildGraphData, windowExceedsThreshold } from '@/services/snowobs/graph'
import { fetchStationTimeseries, SnowObsError } from '@/services/snowobs/snowobs'
import { NextResponse } from 'next/server'

// Serves the station Graphs tab. Reads SnowObs server-side (token stays
// hidden); windows longer than 30 days aggregate to daily min/mean/max.

// Caps sized to the Graphs tab's single fetch: the page's station group plus
// every comparison pick, and the union of all preset variables.
function maxStations(registry: StationRegistry): number {
  return (1 + MAX_COMPARE_STATIONS) * Math.max(...registry.groups.map((g) => g.stids.length))
}
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

function unknownStids(registry: StationRegistry, stids: string[]): string | null {
  const known = new Set(registry.groups.flatMap((g) => g.stids))
  const unknown = stids.filter((stid) => !known.has(stid))
  return unknown.length > 0 ? `unknown stids: ${unknown.join(',')}` : null
}

function validateLists(registry: StationRegistry, stids: string[], vars: string[]): string | null {
  return (
    listBounds('stids', stids, maxStations(registry)) ??
    listBounds('vars', vars, MAX_VARIABLES) ??
    unknownStids(registry, stids)
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
  registry: StationRegistry,
  url: URL,
): NextResponse | { stids: string[]; vars: string[]; from: Date; to: Date } {
  const stids = csvParam(url.searchParams.get('stids'))
  const vars = csvParam(url.searchParams.get('vars'))
  const from = dateParam(url, 'from')
  const to = dateParam(url, 'to')
  const error = validateLists(registry, stids, vars) ?? validateWindow(from, to)
  return error ? badRequest(error) : { stids, vars, from, to }
}

// CRAP is inflated by the lack of unit coverage on this route handler.
// fallow-ignore-next-line complexity
export async function GET(
  request: Request,
  { params }: { params: Promise<Params> },
): Promise<NextResponse> {
  const { center } = await params
  const registry = getStationRegistry(center)
  if (!registry) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const parsed = parseQuery(registry, new URL(request.url))
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
