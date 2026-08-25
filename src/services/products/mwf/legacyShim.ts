// The legacy-shape shim: renders a normalized MWF forecast into the exact
// wire shape of nwac.us's /api/v1/mountain-weather-region-forecast, so
// installed Avy app versions keep working after the Django/WordPress stack
// retires. The Avy app's zod schema is the executable contract; two goldens
// captured from the live API (2026-02-01, Olympics PM + Snoqualmie AM) pin
// the shape in the contract tests.
//
// Observed legacy semantics (from the goldens): the response is ZONE-scoped
// and shows a trimmed window — the first two periods of the issuance and
// their four 6-hour blocks. Values the legacy site bucketed ("LT 0.10"
// precip, "10-20" wind-speed ranges) are emitted as plain numbers here; the
// schema types them as strings either way, and the parity sweep owns any
// closer bucketing.
import { DEFAULT_DROP_FT, deriveSnowLevel, type Entered } from '@/utilities/mwf/mwfData'
import type { MwfPublicForecast } from './source'

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const SUB_PERIOD_LABELS: Record<string, string> = {
  am: 'Morning',
  pm: 'Afternoon',
  ev: 'Evening',
  nt: 'Overnight',
}

const entered = (v: Entered | undefined): number | null => {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function localDate(serviceDate: string, dayOffset: number): Date {
  const [y, m, d] = serviceDate.split('-').map(Number)
  return new Date(y, m - 1, d + dayOffset)
}

function isoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Legacy timestamps are naive UTC "YYYY-MM-DD HH:MM:SS".
function legacyStamp(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

export interface LegacyShimArgs {
  forecast: MwfPublicForecast
  zoneId: string
  authorName?: string | null
}

export function buildLegacyWeatherObject({ forecast, zoneId, authorName }: LegacyShimArgs) {
  const { body, config, structure } = forecast
  const zone = config.zones.find((z) => z.id === zoneId)
  if (!zone) return null

  const slice = structure.issuances[forecast.issuance]
  // The legacy zone response shows the first two periods and their blocks.
  const periods = structure.periods.filter((p) => slice.periods.includes(p.key)).slice(0, 2)
  const periodKeys = new Set(periods.map((p) => p.key))
  const blocks = structure.blocks.filter(
    (b) => slice.blocks.includes(b.key) && periodKeys.has(b.period),
  )

  const periodLabel = (per: (typeof periods)[number]): string => {
    const weekday = WEEKDAYS[localDate(forecast.serviceDate, per.dayOffset).getDay()]
    return per.kind === 'night' ? `${weekday} Night` : weekday
  }

  const zonePoints = config.points.filter((p) => p.zone === zoneId)
  const [firstName, ...restName] = (authorName ?? '').split(' ')

  const sensible = body.sensible?.[zoneId]
  const weatherForecasts: Array<{ date: string; time_of_day: string; description: string }> = []
  if (sensible?.morning) {
    weatherForecasts.push({
      date: forecast.serviceDate,
      // The PM issuance's first slot covers tonight; the AM issuance's covers
      // the whole day (matches the golden pair).
      time_of_day: forecast.issuance === 'afternoon' ? '4-night' : '0-notspec',
      description: sensible.morning,
    })
  }
  if (sensible?.afternoon) {
    weatherForecasts.push({
      date: isoDate(localDate(forecast.serviceDate, 1)),
      time_of_day: '0-notspec',
      description: sensible.afternoon,
    })
  }

  return {
    five_thousand_foot_temperatures: periods.map((per) => {
      const cell = body.temps?.[zoneId]?.[per.key]
      return { min: entered(cell?.low) ?? 0, max: entered(cell?.high) ?? 0 }
    }),
    forecaster: { first_name: firstName ?? '', last_name: restName.join(' ') },
    mountain_weather_forecast: {
      id: forecast.id,
      creation_date: legacyStamp(forecast.createdAt),
      publish_date: legacyStamp(forecast.issuedAt),
      published: 1,
      day1_date: forecast.serviceDate,
      special_header_notes: '',
      synopsis_day1_day2: body.discussion?.synopsis ?? '',
      extended_synopsis: body.discussion?.extended ?? '',
      afternoon: forecast.issuance === 'afternoon' ? 1 : 0,
    },
    periods: periods.map(periodLabel),
    sub_periods: blocks.map((b) => SUB_PERIOD_LABELS[b.key.slice(0, 2)] ?? b.part),
    precipitation_by_location: zonePoints.map((pt, index) => ({
      name: pt.name,
      order: index + 1,
      precipitation: periods.map((per) => {
        const qpf = entered(body.precip?.[pt.code]?.[per.key]?.qpf)
        return { value: qpf == null ? '' : qpf.toFixed(2) }
      }),
    })),
    snow_levels: blocks.map((b) => {
      const cell = body.snowLevel?.[zoneId]?.[b.key]
      const level = deriveSnowLevel(cell?.freezing ?? null, cell?.drop ?? DEFAULT_DROP_FT)
      return { elevation: level ?? 0 }
    }),
    ridgeline_winds: blocks.map((b) => {
      const cell = body.wind?.[zoneId]?.[b.key]
      const speed = entered(cell?.speed)
      return {
        direction: cell?.dir || null,
        speed: speed == null ? null : String(speed),
      }
    }),
    weather_forecasts: weatherForecasts,
    zone_name: zone.name,
    sap_zone_name: zone.name,
    zone_slug: zone.id,
    published_datetime: legacyStamp(forecast.issuedAt),
  }
}

export function buildLegacyWeatherResponse(args: LegacyShimArgs) {
  const objects = buildLegacyWeatherObject(args)
  if (!objects) return null
  return {
    meta: { limit: 1, next: null, offset: 0, previous: null, total_count: 1 },
    objects,
  }
}
