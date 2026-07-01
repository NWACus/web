import { forecastFingerprint } from '@/services/nac/forecastFingerprint'
import { forecastCacheTag } from '@/services/nac/nac'
import { resolveZoneFromSlug } from '@/services/nac/resolveZone'
import { getForecastSource } from '@/services/nac/sources'
import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

const NO_STORE = { 'Cache-Control': 'no-store' }

// Reads request headers, so it must never be cached.
export const dynamic = 'force-dynamic'

/**
 * Revalidate-on-view freshness check (safety-critical). The client sends the fingerprint
 * (`If-None-Match`) of the forecast its page currently shows; this fetches the CURRENT forecast
 * fresh and compares:
 *   - unchanged  → 304, the viewer already has the current content.
 *   - changed    → invalidate the forecast cache tag (which also invalidates the forecast page's
 *                  route cache) and return 200, so the client's router.refresh() re-renders with
 *                  fresh data and later viewers get the regenerated page.
 *   - withdrawn  → the fresh fetch is null (forecast retracted): treated as a change.
 *
 * Invariant: the fresh check always runs on every view; validity/expiry never skips it — a
 * correction can be published while a forecast is still inside its validity window.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ center: string }> },
) {
  const { center } = await params
  const zoneSlug = request.nextUrl.searchParams.get('zone')

  if (!zoneSlug) {
    return NextResponse.json(
      { error: 'Missing zone parameter' },
      { status: 400, headers: NO_STORE },
    )
  }

  const zone = await resolveZoneFromSlug(center, zoneSlug)
  if (!zone) {
    return NextResponse.json({ error: 'Zone not found' }, { status: 404, headers: NO_STORE })
  }

  const ifNoneMatch = request.headers.get('if-none-match')
  const fresh = await getForecastSource(center).getForecastFresh(center, zone.zone.id)
  const freshEtag = fresh ? forecastFingerprint(fresh) : null

  // Unchanged: the fresh forecast fingerprint matches what the viewer already rendered.
  if (freshEtag !== null && ifNoneMatch !== null && freshEtag === ifNoneMatch) {
    return new NextResponse(null, { status: 304, headers: NO_STORE })
  }

  // Changed (or withdrawn): purge the forecast cache so a refresh renders the current product.
  revalidateTag(forecastCacheTag(center, zone.zone.id))
  return NextResponse.json({ changed: true, etag: freshEtag }, { status: 200, headers: NO_STORE })
}
