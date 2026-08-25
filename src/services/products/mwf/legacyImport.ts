// Legacy-archive import mapping: the inverse of the legacy shim. The legacy
// zone API serves a trimmed, zone-scoped view (first two periods of the
// issuance + their four 6-hour blocks), so an imported forecast is stitched
// from every configured zone's response for the same legacy forecast id and
// is necessarily partial: periods beyond the legacy window are empty, snow
// levels arrive as final elevations (stored with drop 0 so they render
// verbatim), and bucketed legacy strings ("LT 0.10" precip, "10-20" winds)
// are kept as entered strings where they don't parse cleanly. Provenance is
// marked on the row (source: 'django-import').
import type { SerializedForecast, Zone } from '@/utilities/mwf/mwfData'
import { MWF_STRUCTURE } from '@/utilities/mwf/structure'

// The wire shape of one zone's legacy response `objects` (see the goldens in
// __tests__/server/fixtures/mwf/).
export interface LegacyObjects {
  five_thousand_foot_temperatures: Array<{ min: number; max: number }>
  forecaster?: { first_name?: string; last_name?: string }
  mountain_weather_forecast: {
    id: number
    creation_date: string
    publish_date: string
    day1_date: string
    synopsis_day1_day2?: string
    extended_synopsis?: string
    afternoon: number | boolean
  }
  periods: string[]
  sub_periods: string[]
  precipitation_by_location: Array<{
    name: string
    order: number
    precipitation: Array<{ value: string }>
  }>
  snow_levels: Array<{ elevation: number }>
  ridgeline_winds: Array<{ direction: string | null; speed: string | null }>
  weather_forecasts: Array<{ date: string; time_of_day: string; description: string }>
}

export interface LegacyImportForecast {
  legacyId: number
  serviceDate: string
  issuance: 'morning' | 'afternoon'
  issuedAt: string
  createdAt: string | null
  authorName: string
  body: Partial<SerializedForecast>
}

const naiveUtcToIso = (stamp: string | undefined): string | null => {
  if (!stamp) return null
  const iso = `${stamp.replace(' ', 'T')}Z`
  return Number.isNaN(new Date(iso).getTime()) ? null : iso
}

// A legacy value is stored as a number when it parses cleanly; bucketed
// strings ("LT 0.10", "10-20") are kept verbatim as entered strings.
const numberOrRaw = (value: string | null | undefined): number | string | null => {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : value
}

// Stitch every zone's legacy response for ONE legacy forecast into an import
// row. `byZone` maps our zone id → that zone's `objects`. Zone responses for
// the same forecast share the forecast-level fields; the first is canonical.
export function stitchLegacyForecast(
  byZone: Record<string, LegacyObjects>,
  { pointCodeByName }: { pointCodeByName: Record<string, string> },
): LegacyImportForecast | null {
  const entries = Object.entries(byZone)
  if (!entries.length) return null
  const canonical = entries[0][1]
  const mwf = canonical.mountain_weather_forecast
  const issuance: LegacyImportForecast['issuance'] = mwf.afternoon ? 'afternoon' : 'morning'

  // The legacy window: the first two periods of the issuance and their blocks.
  const slice = MWF_STRUCTURE.issuances[issuance]
  const periodKeys = slice.periods.slice(0, 2)
  const blockKeys = slice.blocks.slice(0, 4)

  const body: Partial<SerializedForecast> = {
    precip: {},
    temps: {},
    snowLevel: {},
    wind: {},
    sensible: {},
    discussion: {
      synopsis: mwf.synopsis_day1_day2 ?? '',
      extended: mwf.extended_synopsis ?? '',
    },
  }

  for (const [zoneId, objects] of entries) {
    objects.five_thousand_foot_temperatures.forEach((pair, i) => {
      const key = periodKeys[i]
      if (!key) return
      ;((body.temps ??= {})[zoneId] ??= {})[key] = { high: pair.max, low: pair.min }
    })
    objects.snow_levels.forEach((level, i) => {
      const key = blockKeys[i]
      if (!key)
        return // Legacy publishes the final snow-level elevation; drop 0 renders it
        // verbatim instead of re-deriving.
      ;((body.snowLevel ??= {})[zoneId] ??= {})[key] = {
        freezing: level.elevation,
        drop: 0,
        mode: 'snow',
      }
    })
    objects.ridgeline_winds.forEach((wind, i) => {
      const key = blockKeys[i]
      if (!key) return
      ;((body.wind ??= {})[zoneId] ??= {})[key] = {
        dir: wind.direction ?? '',
        speed: numberOrRaw(wind.speed),
      }
    })
    objects.precipitation_by_location.forEach((location) => {
      const code = pointCodeByName[location.name]
      if (!code) return
      const cells = ((body.precip ??= {})[code] ??= {})
      location.precipitation.forEach((entry, i) => {
        const key = periodKeys[i]
        if (!key) return
        cells[key] = { qpf: numberOrRaw(entry.value), density: null }
      })
    })
    const [first, second] = objects.weather_forecasts
    ;(body.sensible ??= {})[zoneId] = {
      morning: first?.description ?? '',
      afternoon: second?.description ?? '',
    }
  }

  const issuedAt = naiveUtcToIso(mwf.publish_date)
  if (!issuedAt) return null
  const forecaster = canonical.forecaster ?? {}
  return {
    legacyId: mwf.id,
    serviceDate: mwf.day1_date,
    issuance,
    issuedAt,
    createdAt: naiveUtcToIso(mwf.creation_date),
    authorName: [forecaster.first_name, forecaster.last_name].filter(Boolean).join(' '),
    body,
  }
}

// The point-name → code map the stitcher needs, from the tenant's config.
export function pointCodeByName(
  points: Array<{ code: string; name: string }>,
): Record<string, string> {
  return Object.fromEntries(points.map((p) => [p.name, p.code]))
}

// Zones the importer should query, with their legacy NAC zone ids.
export function importZones(
  zones: Array<{ code: string; name: string; nacZoneIds?: string | null }>,
): Array<Zone & { nacZoneId: string }> {
  return zones
    .map((z) => ({
      id: z.code,
      name: z.name,
      nacZoneId: (z.nacZoneIds ?? '').split(',')[0]?.trim() ?? '',
    }))
    .filter((z) => z.nacZoneId)
}
