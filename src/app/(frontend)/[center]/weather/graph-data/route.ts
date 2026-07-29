import { STATION_GRAPH_PRESETS } from '@/components/WeatherStations/stationGraphPresets'
import {
  MAX_COMPARE_STATIONS,
  NWAC_WEATHER_STATION_GROUPS,
  STATIONS_TENANT_SLUG,
} from '@/constants/weatherStations'
import { buildGraphData, windowExceedsThreshold } from '@/services/snowobs/graph'
import { fetchStationTimeseries, SnowObsError } from '@/services/snowobs/snowobs'
import { NextResponse } from 'next/server'

// The graph engine's data endpoint: serves both the public station Graphs tab
// and the future self-serve builder. Reads SnowObs live server-side (token
// stays hidden), auto-aggregates windows longer than 30 days to daily
// min/mean/max.

const KNOWN_STIDS = new Set(NWAC_WEATHER_STATION_GROUPS.flatMap((g) => g.stids))
// Derived caps: the page's station group plus every comparison pick, and the
// union of all preset variables (the Graphs tab fetches them in one request).
const MAX_GROUP_STIDS = Math.max(...NWAC_WEATHER_STATION_GROUPS.map((g) => g.stids.length))
const MAX_STATIONS = (1 + MAX_COMPARE_STATIONS) * MAX_GROUP_STIDS
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

function unknownStids(stids: string[]): string | null {
  const unknown = stids.filter((stid) => !KNOWN_STIDS.has(stid))
  return unknown.length > 0 ? `unknown stids: ${unknown.join(',')}` : null
}

function validateLists(stids: string[], vars: string[]): string | null {
  return (
    listBounds('stids', stids, MAX_STATIONS) ??
    listBounds('vars', vars, MAX_VARIABLES) ??
    unknownStids(stids)
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
): NextResponse | { stids: string[]; vars: string[]; from: Date; to: Date } {
  const stids = csvParam(url.searchParams.get('stids'))
  const vars = csvParam(url.searchParams.get('vars'))
  const from = dateParam(url, 'from')
  const to = dateParam(url, 'to')
  const error = validateLists(stids, vars) ?? validateWindow(from, to)
  return error ? badRequest(error) : { stids, vars, from, to }
}

// CRAP is inflated by the lack of unit coverage on this route handler.
// fallow-ignore-next-line complexity
export async function GET(
  request: Request,
  { params }: { params: Promise<Params> },
): Promise<NextResponse> {
  const { center } = await params
  if (center !== STATIONS_TENANT_SLUG) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const parsed = parseQuery(new URL(request.url))
  if (parsed instanceof NextResponse) return parsed
  const { stids, vars, from, to } = parsed

  try {
    const response = await fetchStationTimeseries(stids, {
      start: from,
      end: to,
      revalidate: REVALIDATE_SECONDS,
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
