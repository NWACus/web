// False positive: fallow reads `(payload)/api/[...slug]` and `api/[center]` as one dynamic path
// and predicts a runtime crash. Route groups keep the two trees separate — verified against a
// production build, where this route answers and the Payload catch-all still resolves. The sibling
// `warning-freshness`, `danger-map` and `og` routes carry the same waiver.
// fallow-ignore-file dynamic-segment-name-conflicts
import { forecastPageFingerprint, productFingerprint } from '@/services/nac/forecastFingerprint'
import { forecastCacheTag, warningCacheTag, weatherCacheTag } from '@/services/nac/nac'
import { resolveZoneFromSlug } from '@/services/nac/resolveZone'
import { getForecastSource, getWarningSource } from '@/services/nac/sources'
import { NO_STORE, unknownCenterResponse } from '@/utilities/apiResponses'
import {
  changedResponse,
  indeterminateResponse,
  isFingerprint,
  malformedFingerprintResponse,
  unchangedResponse,
} from '@/utilities/freshnessResponses'
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
 * Two failure modes, both erring toward keeping what is already on screen:
 *
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

  const zone = await resolveZoneFromSlug(center, zoneSlug)
  if (!zone) {
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
  if (!freshForecast) return indeterminateResponse()

  // Purge decisions — server-authoritative: compare each fresh product to what the shared cache is
  // actually serving (not the caller's fingerprint), so freshness spam can't evict the caches.
  const [cachedForecast, cachedWarning] = await Promise.all([
    forecasts.getForecast(center, zone.zone.id),
    warnings.getWarning(center, zone.zone.id),
  ])

  if (productFingerprint(cachedForecast) !== productFingerprint(freshForecast)) {
    revalidateTag(forecastCacheTag(center, zone.zone.id))
    const weatherProductId = freshForecast.weather_data?.weather_product_id
    if (weatherProductId) revalidateTag(weatherCacheTag(weatherProductId))
  }

  // An alert that has gone missing is indistinguishable from a failed lookup for that zone, so
  // trust neither: hold the cached alert in the comparison and change nothing.
  const warningVanished = freshWarning === null && cachedWarning !== null
  const trustedWarning = warningVanished ? cachedWarning : freshWarning

  if (!warningVanished && productFingerprint(cachedWarning) !== productFingerprint(freshWarning)) {
    revalidateTag(warningCacheTag(center, zone.zone.id))
  }

  // Refresh decision — is what THIS viewer rendered stale relative to the fresh page?
  const freshEtag = forecastPageFingerprint(freshForecast, trustedWarning)
  if (fingerprint !== freshEtag) return changedResponse(freshEtag)

  // Current under our trusted view — but an unconfirmed warning must not be cached as current.
  return warningVanished ? indeterminateResponse() : unchangedResponse()
}
