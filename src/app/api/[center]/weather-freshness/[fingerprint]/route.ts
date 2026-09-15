// False positive: fallow reads `(payload)/api/[...slug]` and `api/[center]` as one dynamic path
// and predicts a runtime crash. Route groups keep the two trees separate — verified against a
// production build, where the sibling `forecast-freshness` and `warning-freshness` routes answer
// and the Payload catch-all still resolves. They carry the same waiver.
// fallow-ignore-file dynamic-segment-name-conflicts
import { productFingerprint, weatherPageFingerprint } from '@/services/nac/forecastFingerprint'
import type { Weather } from '@/services/nac/model/forecast'
import { currentWeatherCacheTag, getActiveForecastZones, weatherCacheTag } from '@/services/nac/nac'
import { getWeatherSource, type WeatherSource } from '@/services/nac/sources'
import { NO_STORE, unknownCenterResponse } from '@/utilities/apiResponses'
import {
  changedResponse,
  indeterminateResponse,
  isFingerprint,
  malformedFingerprintResponse,
  unchangedResponse,
} from '@/utilities/freshnessResponses'
import { reportIndeterminate } from '@/utilities/freshnessTelemetry'
import { isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

/**
 * `force-dynamic` for the same reason as the forecast and warning freshness routes: it keeps this
 * route out of the prerender manifest, so the `Cache-Control` each answer sets below reaches the
 * CDN verbatim and Next's Full Route Cache can never bake a "you're current" in.
 */
export const dynamic = 'force-dynamic'

/** The address a page with nothing published asks about — see the `!fresh` branch below. */
const NOTHING_PUBLISHED = weatherPageFingerprint(null)

/**
 * Purge decision, server-side: the fresh product is compared to what the shared cache is actually
 * serving, never to the caller's fingerprint, so freshness spam cannot evict the cache. A change
 * purges the current-product tag this page renders from, and the by-id tag of the product itself,
 * so a forecast page's inline weather card sharing that product comes back corrected too.
 */
async function reconcileCache(
  center: string,
  zoneId: number,
  weather: WeatherSource,
  fresh: Weather,
): Promise<void> {
  const cached = await weather.getCurrentWeather(center, zoneId)
  if (productFingerprint(cached) === productFingerprint(fresh)) return

  revalidateTag(currentWeatherCacheTag(center, zoneId))
  revalidateTag(weatherCacheTag(fresh.id))
  if (cached && cached.id !== fresh.id) revalidateTag(weatherCacheTag(cached.id))
}

/**
 * Revalidate-on-view freshness check for the standalone Mountain Weather page. The page is ISR on
 * a five-minute window; this closes it the way the forecast route does for the forecast, so a
 * weather product corrected or re-issued after the page rendered reaches an open tab. The viewer
 * asks about the fingerprint of the product they rendered — a path segment, so the common
 * "you're current" answer is cacheable at the edge — and two decisions are made independently:
 *
 *   1. Purge the SHARED cache? Only where the fresh product genuinely differs from what the cache
 *      serves (`reconcileCache`), never on the caller's say-so.
 *   2. Refresh THIS viewer? When the fresh fingerprint differs from the one they rendered.
 *
 * The product is center-wide, so the address is center-scoped and the query goes through the
 * center's first active zone, exactly as the page (and the legacy widget) asks for it.
 *
 * Every failure lands on the uncacheable *indeterminate* answer rather than a 500 or a blank: the
 * zone list being unreachable (the one call here that throws), and no fresh product at all
 * (upstream error, parse failure, or genuinely none). Neither purges anything, so a transient blip
 * never blanks the last-known-good product, and neither is cached, so the next viewer retries.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ center: string; fingerprint: string }> },
) {
  const { center, fingerprint } = await params

  if (!isFingerprint(fingerprint)) return malformedFingerprintResponse()

  // The center is interpolated into an upstream NAC URL, so only serve known tenants.
  if (!isValidTenantSlug(center)) return unknownCenterResponse()

  const zones = await getActiveForecastZones(center).catch(() => undefined)
  if (zones === undefined) {
    reportIndeterminate('zones-unreachable', center)
    return indeterminateResponse()
  }
  if (zones.length === 0) {
    return NextResponse.json({ error: 'No forecast zones' }, { status: 404, headers: NO_STORE })
  }

  const zoneId = zones[0].zone.id
  const weather = getWeatherSource(center)
  const fresh = await weather.getCurrentWeatherFresh(center, zoneId)

  if (!fresh) {
    // "None published" and "could not fetch" are the same null. The benign form has a tell: a page
    // that also had nothing asks about the absent-product address, and is not worth a report.
    if (fingerprint !== NOTHING_PUBLISHED) reportIndeterminate('no-fresh-weather', center)
    return indeterminateResponse()
  }

  await reconcileCache(center, zoneId, weather, fresh)

  const freshEtag = weatherPageFingerprint(fresh)
  if (fingerprint !== freshEtag) return changedResponse(freshEtag)

  return unchangedResponse()
}
