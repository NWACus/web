// False positive: fallow reads `(payload)/api/[...slug]` and `api/[center]` as one dynamic path
// and predicts a runtime crash. Route groups keep the two trees separate — verified against a
// production build, where this route answers and the Payload catch-all still resolves. The sibling
// `warning-freshness`, `danger-map` and `og` routes carry the same waiver.
// fallow-ignore-file dynamic-segment-name-conflicts
import { forecastFingerprint } from '@/services/nac/forecastFingerprint'
import { forecastCacheTag, weatherCacheTag } from '@/services/nac/nac'
import { resolveZoneFromSlug } from '@/services/nac/resolveZone'
import { getForecastSource } from '@/services/nac/sources'
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
 * fingerprint of the forecast it is showing, and asks about it here — the fingerprint is a path
 * segment, so the answer is content-addressed and the common "you're current" reply can be served
 * from the edge (see `freshnessResponses` for why only that one is cacheable). This fetches the
 * CURRENT forecast fresh (short-cached upstream) and decides two things independently:
 *
 *   1. Purge the SHARED cache? Only when the fresh product genuinely differs from what the cache is
 *      serving — a server-side comparison, NOT the caller-supplied fingerprint, so an
 *      unauthenticated client can't force repeated purges (which would defeat the cache and
 *      amplify upstream load). On a real change we revalidate the forecast tag (which also
 *      invalidates the page's route cache) and the weather product's tag, so a refresh renders
 *      fresh forecast + weather together.
 *   2. Refresh THIS viewer? When the fresh fingerprint differs from the one they rendered →
 *      `changed: true` so their router.refresh() re-renders; otherwise `changed: false`.
 *
 * A failed or absent fresh fetch (upstream error, parse failure, or genuinely no product) is
 * *indeterminate*: it reports no change and never purges — so a transient upstream blip can't blank
 * the last-known-good forecast — but it is never cached, so the next viewer retries immediately.
 * The ISR window remains the backstop, and a genuine withdrawal is caught by that window.
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

  const source = getForecastSource(center)
  const fresh = await source.getForecastFresh(center, zone.zone.id)

  // No fresh product (upstream error, parse failure, or genuinely none published): do NOT purge the
  // cache — leave the last-known-good forecast in place and let the ISR window back it up.
  if (!fresh) return indeterminateResponse()

  const freshEtag = forecastFingerprint(fresh)

  // Purge decision — server-authoritative: compare the fresh product to what the shared cache is
  // actually serving (not the caller's fingerprint), so freshness spam can't evict the cache.
  const cached = await source.getForecast(center, zone.zone.id)
  const cacheIsStale = !cached || forecastFingerprint(cached) !== freshEtag
  if (cacheIsStale) {
    revalidateTag(forecastCacheTag(center, zone.zone.id))
    const weatherProductId = fresh.weather_data?.weather_product_id
    if (weatherProductId) revalidateTag(weatherCacheTag(weatherProductId))
  }

  // Refresh decision — is what THIS viewer rendered stale relative to the fresh product?
  return fingerprint === freshEtag ? unchangedResponse() : changedResponse(freshEtag)
}
