import { forecastFingerprint } from '@/services/nac/forecastFingerprint'
import { forecastCacheTag, weatherCacheTag } from '@/services/nac/nac'
import { resolveZoneFromSlug } from '@/services/nac/resolveZone'
import { getForecastSource } from '@/services/nac/sources'
import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

const NO_STORE = { 'Cache-Control': 'no-store' }

// Reads request headers, so it must never be cached.
export const dynamic = 'force-dynamic'

/**
 * Revalidate-on-view freshness check (safety-critical). On mount the client sends the fingerprint
 * (`If-None-Match`) of the forecast its ISR page currently shows. This fetches the CURRENT forecast
 * fresh (short-cached upstream) and decides two things independently:
 *
 *   1. Purge the SHARED cache? Only when the fresh product genuinely differs from what the cache is
 *      serving — a server-side comparison, NOT the caller-controlled header, so an unauthenticated
 *      client can't force repeated purges (which would defeat the cache and amplify upstream load).
 *      On a real change we revalidate the forecast tag (which also invalidates the page's route
 *      cache) and the weather product's tag, so a refresh renders fresh forecast + weather together.
 *   2. Refresh THIS viewer? When the fresh fingerprint differs from the one they rendered (their
 *      If-None-Match) → 200 so their router.refresh() re-renders; otherwise 304.
 *
 * A failed or absent fresh fetch (upstream error, parse failure, or genuinely no product) returns
 * 304 and never purges — so a transient upstream blip can't blank the last-known-good forecast; the
 * ISR window remains the backstop, and a genuine withdrawal is caught by that window.
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

  const source = getForecastSource(center)
  const fresh = await source.getForecastFresh(center, zone.zone.id)

  // No fresh product (upstream error, parse failure, or genuinely none published): do NOT purge the
  // cache — leave the last-known-good forecast in place and let the ISR window back it up.
  if (!fresh) {
    return new NextResponse(null, { status: 304, headers: NO_STORE })
  }
  const freshEtag = forecastFingerprint(fresh)

  // Purge decision — server-authoritative: compare the fresh product to what the shared cache is
  // actually serving (not the caller's header), so freshness spam can't evict the cache.
  const cached = await source.getForecast(center, zone.zone.id)
  const cacheIsStale = !cached || forecastFingerprint(cached) !== freshEtag
  if (cacheIsStale) {
    revalidateTag(forecastCacheTag(center, zone.zone.id))
    const weatherProductId = fresh.weather_data?.weather_product_id
    if (weatherProductId) revalidateTag(weatherCacheTag(weatherProductId))
  }

  // Refresh decision — is what THIS viewer rendered stale relative to the fresh product?
  const ifNoneMatch = request.headers.get('if-none-match')
  if (ifNoneMatch !== null && ifNoneMatch === freshEtag) {
    return new NextResponse(null, { status: 304, headers: NO_STORE })
  }
  return NextResponse.json({ changed: true, etag: freshEtag }, { status: 200, headers: NO_STORE })
}
