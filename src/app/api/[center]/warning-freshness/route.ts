// False positive: fallow reads `(payload)/api/[...slug]` and `api/[center]` as one dynamic path
// and predicts a runtime crash. Route groups keep the two trees separate — verified against a
// production build (`pnpm dev:prod`), where this route answers 200/304 and the Payload catch-all
// still resolves. The sibling `forecast-freshness` route, in production since #1129, trips the
// same check.
// fallow-ignore-file dynamic-segment-name-conflicts
import {
  centerWarningsFingerprint,
  getCenterWarnings,
  getCenterWarningsFresh,
  type CenterWarningGroup,
} from '@/services/nac/centerWarnings'
import { warningCacheTag } from '@/services/nac/nac'
import { isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

const NO_STORE = { 'Cache-Control': 'no-store' }

// Reads request headers, so it must never be cached.
export const dynamic = 'force-dynamic'

function affectedZoneIds(groups: CenterWarningGroup[]): number[] {
  return groups.flatMap((group) => group.entries.map((entry) => entry.zone.id))
}

/**
 * Revalidate-on-view freshness check for the center-level warnings banner (safety-critical). The
 * home page is statically generated on a long window, so an alert issued or lifted after it
 * rendered would otherwise sit unseen. On mount the client sends the fingerprint
 * (`If-None-Match`) of the alert set its page currently shows. This fetches the center's CURRENT
 * alerts fresh (short-cached upstream) and decides two things independently:
 *
 *   1. Purge the UPSTREAM data cache? Only when the fresh alert set genuinely differs from what
 *      the cache is serving — a server-side comparison, NOT the caller-controlled header, so an
 *      unauthenticated client can't force repeated purges (which would defeat the cache and
 *      amplify upstream load). On a real change we revalidate the warning tag of every zone on
 *      either side of the change.
 *   2. Refresh THIS viewer? When the fresh fingerprint differs from the one they rendered (their
 *      If-None-Match) → 200 so their router.refresh() re-renders; otherwise 304. Telling a viewer
 *      to refresh is paired with revalidating the home page's own route cache: without that the
 *      refresh would re-serve the same statically rendered banner and the client would ask again
 *      on every view, never converging. That purge only re-renders a page from the (still cached)
 *      upstream data, so unlike a tag purge it costs no upstream requests.
 *
 * Failure handling is deliberately asymmetric: hiding a live warning is dangerous, showing a
 * lifted one is merely stale. So a failed fetch (the center metadata request throws) returns 304
 * and never purges, and a fresh set that has gone *empty* while the cache holds alerts is not
 * trusted either — the source collapses "no alert" and "this zone's request failed" to the same
 * null, so an upstream blip must not be allowed to blank a live banner. A genuine all-clear still
 * propagates once the short upstream cache and the page's revalidate window catch up.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ center: string }> },
) {
  const { center } = await params

  // This endpoint fans one upstream request out per zone, so only serve known tenants.
  if (!isValidTenantSlug(center)) {
    return NextResponse.json({ error: 'Unknown center' }, { status: 404, headers: NO_STORE })
  }

  let fresh: CenterWarningGroup[]
  let cached: CenterWarningGroup[]
  try {
    fresh = await getCenterWarningsFresh(center)
    // Purge decision — server-authoritative: compare the fresh alerts to what the shared cache is
    // actually serving (not the caller's header), so freshness spam can't evict the cache.
    cached = await getCenterWarnings(center)
  } catch {
    // Upstream is unreachable: leave the last-known-good banner in place and let the page's
    // revalidate window back it up.
    return new NextResponse(null, { status: 304, headers: NO_STORE })
  }

  const freshEtag = centerWarningsFingerprint(fresh)
  const cacheIsStale = centerWarningsFingerprint(cached) !== freshEtag

  // The fresh set has gone empty while the cache still holds alerts. This is either a genuine
  // all-clear or an upstream blip on the warned zone's request, and the source collapses both to
  // the same "no alert" — so trust neither: change nothing and tell nobody. A real all-clear
  // arrives here again once the short upstream cache expires and `cached` agrees.
  if (fresh.length === 0 && cached.length > 0) {
    return new NextResponse(null, { status: 304, headers: NO_STORE })
  }

  if (cacheIsStale) {
    const zoneIds = new Set([...affectedZoneIds(cached), ...affectedZoneIds(fresh)])
    for (const zoneId of zoneIds) {
      revalidateTag(warningCacheTag(center, zoneId))
    }
  }

  // Refresh decision — is what THIS viewer rendered stale relative to the fresh alert set?
  const ifNoneMatch = request.headers.get('if-none-match')
  if (ifNoneMatch === freshEtag) {
    return new NextResponse(null, { status: 304, headers: NO_STORE })
  }

  // The banner's host page is statically generated, so a router.refresh() alone would re-serve
  // the same rendered banner. Purge the page too, or the client re-asks on every view forever.
  revalidatePath('/')
  revalidatePath(`/${center}`)

  return NextResponse.json({ changed: true, etag: freshEtag }, { status: 200, headers: NO_STORE })
}
