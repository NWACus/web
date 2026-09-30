// False positive: fallow reads `(payload)/api/[...slug]` and `api/[center]` as one dynamic path
// and predicts a runtime crash. Route groups keep the two trees separate — verified against a
// production build, where this route answers and the Payload catch-all still resolves. The sibling
// `warning-freshness`, `danger-map` and `og` routes carry the same waiver.
// fallow-ignore-file dynamic-segment-name-conflicts
import { forecastPageFingerprint, productFingerprint } from '@/services/nac/forecastFingerprint'
import type { ForecastResult, WarningProduct } from '@/services/nac/model/forecast'
import { forecastCacheTag, warningCacheTag, weatherCacheTag } from '@/services/nac/nac'
import { resolveZoneFromSlug } from '@/services/nac/resolveZone'
import {
  getForecastSource,
  getWarningSource,
  type ForecastSource,
  type WarningSource,
} from '@/services/nac/sources'
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
 * Kept `force-dynamic` even though the answers below are meant to be edge-cached, because the two
 * are not in tension: Next sends a route handler's own `Cache-Control` to the CDN verbatim as long
 * as the route is absent from the prerender manifest, which `force-dynamic` guarantees. What it
 * buys is a structural guard — were this route ever given `generateStaticParams` or
 * `revalidate = false`, Next's Full Route Cache would bake a response in and ignore its `no-store`
 * entirely, which on a freshness endpoint means serving "you're current" forever. Verified against
 * next@15.4.11 with a production build: both freshness routes come out `ƒ (Dynamic)` and absent
 * from `prerender-manifest.json`, and each of the three answers below leaves the server with the
 * Cache-Control it set. Note Vercel strips `s-maxage` from the header it delivers downstream, so
 * confirm edge caching with `x-vercel-cache: MISS → HIT`, never by reading the header.
 */
export const dynamic = 'force-dynamic'

/** The address a page with nothing published asks about — see the `!freshForecast` branch below. */
const NOTHING_PUBLISHED = forecastPageFingerprint(null, null)

/**
 * Purge decision, decided per product and entirely server-side: each fresh product is compared to
 * what the shared cache is actually serving, never to the caller's fingerprint, so freshness spam
 * cannot evict the caches. Per product rather than per page, so a warning-only change costs no
 * upstream forecast re-fetch; a changed forecast additionally purges the weather product it points
 * at, so a refresh renders the two together.
 *
 * Also settles which warning the answer is built from. An alert that has gone missing upstream is
 * indistinguishable from a failed lookup for that zone, so neither is trusted: the cached alert is
 * held instead and nothing is purged. The caller needs `warningVanished` because an unconfirmed
 * warning state must not be parked at the edge as "you're current".
 */
async function reconcileCaches({
  center,
  zoneId,
  forecasts,
  warnings,
  freshForecast,
  freshWarning,
}: {
  center: string
  zoneId: number
  forecasts: ForecastSource
  warnings: WarningSource
  freshForecast: ForecastResult
  freshWarning: WarningProduct | null
}): Promise<{ trustedWarning: WarningProduct | null; warningVanished: boolean }> {
  const [cachedForecast, cachedWarning] = await Promise.all([
    forecasts.getForecast(center, zoneId),
    warnings.getWarning(center, zoneId),
  ])

  if (productFingerprint(cachedForecast) !== productFingerprint(freshForecast)) {
    revalidateTag(forecastCacheTag(center, zoneId))
    const weatherProductId = freshForecast.weather_data?.weather_product_id
    if (weatherProductId) revalidateTag(weatherCacheTag(weatherProductId))
  }

  const warningVanished = freshWarning === null && cachedWarning !== null

  if (!warningVanished && productFingerprint(cachedWarning) !== productFingerprint(freshWarning)) {
    revalidateTag(warningCacheTag(center, zoneId))
  }

  return { trustedWarning: warningVanished ? cachedWarning : freshWarning, warningVanished }
}

/**
 * Revalidate-on-view freshness check (safety-critical). The viewer's page renders with a
 * fingerprint of what it is showing — the forecast *and* the zone's active warning, since both are
 * on the page and each turns over on its own — and asks about it here. The fingerprint is a path
 * segment, so the answer is content-addressed and the common "you're current" reply can be served
 * from the edge (see `freshnessResponses` for why only that one is cacheable). This fetches both
 * products fresh (short-cached upstream) and decides two things independently:
 *
 *   1. Purge the SHARED caches? Only where the fresh product genuinely differs from what the cache
 *      is serving — a server-side comparison, NOT the caller-supplied fingerprint, so an
 *      unauthenticated client can't force repeated purges (which would defeat the cache and
 *      amplify upstream load). Per product, not per page: a warning-only change purges the warning
 *      tag alone, so it doesn't cost an upstream forecast re-fetch it has no reason to. Either tag
 *      also invalidates the page's route cache, and a changed forecast additionally purges the
 *      weather product it points at, so a refresh renders forecast + weather together.
 *   2. Refresh THIS viewer? When the fresh page fingerprint differs from the one they rendered →
 *      `changed: true` so their router.refresh() re-renders; otherwise `changed: false`.
 *
 * Three failure modes, all erring toward keeping what is already on screen:
 *
 * - **The zone list is unreachable**, which is the one upstream call here that throws rather than
 *   returning null. Indeterminate, not a 500: an unhandled throw is an answer whose cache policy
 *   nothing below decides.
 * - **No fresh forecast** (upstream error, parse failure, or genuinely none published) is
 *   *indeterminate*: it reports no change and never purges — so a transient upstream blip can't
 *   blank the last-known-good forecast — but it is never cached, so the next viewer retries
 *   immediately. The ISR window remains the backstop, and a genuine withdrawal is caught there.
 * - **A warning that has vanished** while the cache still holds one is not trusted either. The
 *   source collapses "no alert" and "this zone's request failed" to the same null, so an upstream
 *   blip must not be allowed to blank a live banner — matching `warning-freshness`. The cached
 *   alert is held in the comparison instead, nothing is purged, and if that leaves the viewer
 *   otherwise current the answer is indeterminate rather than the cacheable "you're current": we
 *   will not park an unconfirmed warning state at the edge for a TTL. A genuine all-clear arrives
 *   once the short upstream cache expires and the cached side agrees.
 *
 * Invariant: the fresh check always runs on every view; validity/expiry never skips it — a
 * correction can be published while a forecast is still inside its validity window.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ center: string; zone: string; fingerprint: string }> },
) {
  const { center, zone: zoneSlug, fingerprint } = await params

  if (!isFingerprint(fingerprint)) return malformedFingerprintResponse()

  // Both segments below are caller-controlled and the center is interpolated into an upstream NAC
  // URL, so only serve known tenants — matching the warning-freshness and danger-map siblings.
  if (!isValidTenantSlug(center)) return unknownCenterResponse()

  // Resolving the slug reaches upstream for the center's zone list, and unlike every product fetch
  // below it *throws* on failure rather than returning null. Those are two different answers: a
  // slug that is not one of this center's is the caller's mistake (404), while an upstream we could
  // not reach is the same indeterminate we give a failed product fetch — no purge, never cached,
  // retried by the next viewer. Left uncaught it was an unhandled 500, the one answer this route's
  // cache policy does not cover.
  const zone = await resolveZoneFromSlug(center, zoneSlug).catch(() => undefined)
  if (zone === undefined) {
    reportIndeterminate('zones-unreachable', center)
    return indeterminateResponse()
  }
  if (zone === null) {
    return NextResponse.json({ error: 'Zone not found' }, { status: 404, headers: NO_STORE })
  }

  const forecasts = getForecastSource(center)
  const warnings = getWarningSource(center)

  const [freshForecast, freshWarning] = await Promise.all([
    forecasts.getForecastFresh(center, zone.zone.id),
    warnings.getWarningFresh(center, zone.zone.id),
  ])

  // No fresh forecast: do NOT purge anything — leave the last-known-good page in place and let the
  // ISR window back it up.
  if (!freshForecast) {
    // Worth reporting only when it is a failure. "None published" and "we could not fetch it" are
    // the same null here, and the benign form has a tell: a page that also had nothing is asking
    // about the absent-product address, which an off-season zone does on every view all season.
    // A page that rendered a product and can no longer have it confirmed is the other thing.
    if (fingerprint !== NOTHING_PUBLISHED) reportIndeterminate('no-fresh-forecast', center)
    return indeterminateResponse()
  }

  const { trustedWarning, warningVanished } = await reconcileCaches({
    center,
    zoneId: zone.zone.id,
    forecasts,
    warnings,
    freshForecast,
    freshWarning,
  })

  // Refresh decision — is what THIS viewer rendered stale relative to the fresh page?
  const freshEtag = forecastPageFingerprint(freshForecast, trustedWarning)
  if (fingerprint !== freshEtag) return changedResponse(freshEtag)

  // Current under our trusted view — but an unconfirmed warning must not be cached as current.
  if (!warningVanished) return unchangedResponse()

  reportIndeterminate('warning-vanished', center)
  return indeterminateResponse()
}
