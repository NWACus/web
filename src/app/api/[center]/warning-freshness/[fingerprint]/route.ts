// False positive: fallow reads `(payload)/api/[...slug]` and `api/[center]` as one dynamic path
// and predicts a runtime crash. Route groups keep the two trees separate — verified against a
// production build (`pnpm dev:prod`), where this route answers and the Payload catch-all still
// resolves. The sibling `forecast-freshness` route, in production since #1129, trips the same
// check.
// fallow-ignore-file dynamic-segment-name-conflicts
import {
  centerWarningsFingerprint,
  getCenterWarnings,
  getCenterWarningsFresh,
  type CenterWarningGroup,
} from '@/services/nac/centerWarnings'
import { warningCacheTag } from '@/services/nac/nac'
import { unknownCenterResponse } from '@/utilities/apiResponses'
import {
  changedResponse,
  indeterminateResponse,
  isFingerprint,
  malformedFingerprintResponse,
  unchangedResponse,
} from '@/utilities/freshnessResponses'
import { isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { revalidatePath, revalidateTag } from 'next/cache'

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

function affectedZoneIds(groups: CenterWarningGroup[]): number[] {
  return groups.flatMap((group) => group.entries.map((entry) => entry.zone.id))
}

/**
 * Revalidate-on-view freshness check for the center-level warnings banner (safety-critical). The
 * home page is statically generated on a long window, so an alert issued or lifted after it
 * rendered would otherwise sit unseen. The viewer's page renders with a fingerprint of the alert
 * set it is showing and asks about it here — as a path segment, so the answer is content-addressed
 * and the common "you're current" reply can be served from the edge (see `freshnessResponses` for
 * why only that one is cacheable). This fetches the center's CURRENT alerts fresh (short-cached
 * upstream) and decides two things independently:
 *
 *   1. Purge the UPSTREAM data cache? Only when the fresh alert set genuinely differs from what
 *      the cache is serving — a server-side comparison, NOT the caller-supplied fingerprint, so an
 *      unauthenticated client can't force repeated purges (which would defeat the cache and
 *      amplify upstream load). On a real change we revalidate the warning tag of every zone on
 *      either side of the change.
 *   2. Refresh THIS viewer? When the fresh fingerprint differs from the one they rendered →
 *      `changed: true` so their router.refresh() re-renders; otherwise `changed: false`. Telling a
 *      viewer to refresh is paired with revalidating the home page's own route cache: without that
 *      the refresh would re-serve the same statically rendered banner and the client would ask
 *      again on every view, never converging. That purge only re-renders a page from the (still
 *      cached) upstream data, so unlike a tag purge it costs no upstream requests.
 *
 * Failure handling is deliberately asymmetric: hiding a live warning is dangerous, showing a
 * lifted one is merely stale. So a failed fetch (the center metadata request throws) never purges,
 * and a fresh set that has gone *empty* while the cache holds alerts is not trusted either — the
 * source collapses "no alert" and "this zone's request failed" to the same null, so an upstream
 * blip must not be allowed to blank a live banner. Both are *indeterminate*: they report no change
 * so nothing is blanked, but they are never cached, so the next viewer retries immediately. A
 * genuine all-clear still propagates once the short upstream cache and the page's revalidate
 * window catch up.
 *
 * One bounded gap is accepted deliberately: when the fresh set is empty AND the cache agrees, a
 * single zone's request having failed is indistinguishable from that zone having no alert, so the
 * answer is the cacheable "you're current" and a newly issued warning on that zone can go unseen
 * for up to the staleness budget. Routing empty-fresh to indeterminate would close it — and would
 * also make the answer uncacheable for the steady state, which is "no alerts anywhere" for most of
 * the season. That is the one answer Part A exists to cache, so every home-page view at every POP
 * would reach origin and fan one upstream request out per zone, amplifying load onto the AFP and
 * making the very blips this is about more likely. The gap is bounded by the TTL, with the home
 * page's ISR window and the open-tab re-checks behind it; the amplification is not.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ center: string; fingerprint: string }> },
) {
  const { center, fingerprint } = await params

  if (!isFingerprint(fingerprint)) return malformedFingerprintResponse()

  // This endpoint fans one upstream request out per zone, so only serve known tenants.
  if (!isValidTenantSlug(center)) return unknownCenterResponse()

  let fresh: CenterWarningGroup[]
  let cached: CenterWarningGroup[]
  try {
    fresh = await getCenterWarningsFresh(center)
    // Purge decision — server-authoritative: compare the fresh alerts to what the shared cache is
    // actually serving (not the caller's fingerprint), so freshness spam can't evict the cache.
    cached = await getCenterWarnings(center)
  } catch {
    // Upstream is unreachable: leave the last-known-good banner in place and let the page's
    // revalidate window back it up.
    return indeterminateResponse()
  }

  const freshEtag = centerWarningsFingerprint(fresh)
  const cacheIsStale = centerWarningsFingerprint(cached) !== freshEtag

  // The fresh set has gone empty while the cache still holds alerts. This is either a genuine
  // all-clear or an upstream blip on the warned zone's request, and the source collapses both to
  // the same "no alert" — so trust neither: change nothing and tell nobody. A real all-clear
  // arrives here again once the short upstream cache expires and `cached` agrees.
  if (fresh.length === 0 && cached.length > 0) return indeterminateResponse()

  if (cacheIsStale) {
    const zoneIds = new Set([...affectedZoneIds(cached), ...affectedZoneIds(fresh)])
    for (const zoneId of zoneIds) {
      revalidateTag(warningCacheTag(center, zoneId))
    }
  }

  // Refresh decision — is what THIS viewer rendered stale relative to the fresh alert set?
  if (fingerprint === freshEtag) return unchangedResponse()

  // The banner's host page is statically generated, so a router.refresh() alone would re-serve
  // the same rendered banner. Purge the page too, or the client re-asks on every view forever.
  revalidatePath('/')
  revalidatePath(`/${center}`)

  return changedResponse(freshEtag)
}
