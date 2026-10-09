import { isCalendarDate } from '@/services/nac/archiveDates'
import { format, parseISO, subDays } from 'date-fns'

const FORECAST_ZONE_PATH_PREFIX = 'forecasts/avalanche/'

/** What a `route=forecasts/avalanche/…` image asks for. */
export type ForecastImageTarget =
  /** A zone's card: today's danger, or a past day's when `day` is set. */
  | { kind: 'zone'; zone: string; day: string | null }
  /** A dated route whose date isn't usable; drawn as the undated center card. */
  | { kind: 'invalid' }

/**
 * A zone image shows a live danger rating, so it gets the native page's 5-minute window rather
 * than @vercel/og's year-long `immutable` default. The versioned URL is what turns a preview over;
 * this bounds how long one address can serve a rating that has since changed.
 */
const LIVE_IMAGE_CACHE_CONTROL = 'public, max-age=300, s-maxage=300'

/** A settled day's danger no longer changes, so its card can be held for a day. */
const SETTLED_DAY_IMAGE_CACHE_CONTROL = 'public, max-age=86400, s-maxage=86400'

/** `YYYY-MM-DD` of the UTC day `daysAgo` before `now`. */
function utcDay(now: Date, daysAgo: number): string {
  return subDays(now, daysAgo).toISOString().slice(0, 10)
}

/** The `<zone>` or `<zone>/<date>` segments after the prefix, or null for any other route. */
function zoneRouteSegments(route: string | null): string[] | null {
  const segments = route?.startsWith(FORECAST_ZONE_PATH_PREFIX)
    ? route.slice(FORECAST_ZONE_PATH_PREFIX.length).split('/').filter(Boolean)
    : []
  return segments.length === 1 || segments.length === 2 ? segments : null
}

/** A real calendar day no later than today in UTC, which runs ahead of every center's clock. */
function isPastOrCurrentDay(day: string, now: Date): boolean {
  return isCalendarDate(day) && day <= utcDay(now, 0)
}

/**
 * The zone, and for an archived page the day, a `forecasts/avalanche/<zone>[/<date>]` route asks
 * for. A date that is malformed or still ahead is `invalid` and never reaches upstream. Null when
 * the route isn't a forecast zone at all.
 */
export function parseForecastRoute(
  route: string | null,
  now: Date = new Date(),
): ForecastImageTarget | null {
  const segments = zoneRouteSegments(route)
  if (!segments) return null

  const [zone, day] = segments
  if (!day) return { kind: 'zone', zone, day: null }

  return isPastOrCurrentDay(day, now) ? { kind: 'zone', zone, day } : { kind: 'invalid' }
}

/**
 * The `cache-control` for a forecast image, or undefined to keep @vercel/og's default (for every
 * other image). A day counts as settled two UTC days back: UTC can be a day ahead of a center, and
 * a center's yesterday is still its current product until the morning's forecast publishes.
 * Everything else, a rejected date included, stays short so it can't be pinned for long.
 */
export function forecastImageCacheControl(
  target: ForecastImageTarget | null,
  now: Date = new Date(),
): string | undefined {
  if (!target) return undefined
  if (target.kind === 'zone' && target.day && target.day <= utcDay(now, 2)) {
    return SETTLED_DAY_IMAGE_CACHE_CONTROL
  }
  return LIVE_IMAGE_CACHE_CONTROL
}

/** "Avalanche Forecast", or "Avalanche Forecast · April 1, 2026" for an archived day's card. */
export function forecastImageSubtitle(day: string | null): string {
  return day
    ? `Avalanche Forecast · ${format(parseISO(day), 'MMMM d, yyyy')}`
    : 'Avalanche Forecast'
}
