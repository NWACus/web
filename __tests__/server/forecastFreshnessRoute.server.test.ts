import { forecastPageFingerprint } from '@/services/nac/forecastFingerprint'
import { ProductType } from '@/services/nac/model/forecast'
import { mapV2ForecastResult } from '@/services/nac/sources/v2/mappers'
import { forecastResultSchema } from '@/services/nac/types/forecastSchemas'
import { warningFixture } from '../fixtures/warningProducts'
import nwacForecastActive from './fixtures/nwac-forecast-active.json'

const mockRevalidateTag = jest.fn()
jest.mock('next/cache', () => ({ revalidateTag: (tag: string) => mockRevalidateTag(tag) }))

const mockResolveZone = jest.fn()
jest.mock('../../src/services/nac/resolveZone', () => ({
  resolveZoneFromSlug: (...args: unknown[]) => mockResolveZone(...args),
}))

const mockGetForecastFresh = jest.fn()
const mockGetForecast = jest.fn()
const mockGetWarningFresh = jest.fn()
const mockGetWarning = jest.fn()
jest.mock('../../src/services/nac/sources', () => ({
  getForecastSource: () => ({
    getForecastFresh: (...a: unknown[]) => mockGetForecastFresh(...a),
    getForecast: (...a: unknown[]) => mockGetForecast(...a),
  }),
  getWarningSource: () => ({
    getWarningFresh: (...a: unknown[]) => mockGetWarningFresh(...a),
    getWarning: (...a: unknown[]) => mockGetWarning(...a),
  }),
}))

// Avoid loading the real nac module (and payload) just for the cache-tag helpers.
jest.mock('../../src/services/nac/nac', () => ({
  forecastCacheTag: (centerId: string, zoneId: number) =>
    `forecast:${centerId === 'dvac' ? 'nwac' : centerId}:${zoneId}`,
  weatherCacheTag: (id: number) => `weather:${id}`,
  warningCacheTag: (centerId: string, zoneId: number) => `warning:${centerId}:${zoneId}`,
}))

// Import the handler after the mocks are registered (jest hoists the mocks above imports).
import { GET } from '@/app/api/[center]/forecast-freshness/[zone]/[fingerprint]/route'

const forecast = mapV2ForecastResult(forecastResultSchema.parse(nwacForecastActive))
const warning = warningFixture(ProductType.Warning)
/** What a viewer rendered when the zone had a forecast and no active alert. */
const etag = forecastPageFingerprint(forecast, null)
/** A well-formed fingerprint that no product will ever hash to. */
const STALE_ETAG = 'f'.repeat(40)

const CACHEABLE = 'public, max-age=0, s-maxage=30'
const ZONE = 'west-slopes-north'

/** Ask the endpoint on behalf of a viewer whose page rendered `fingerprint`. */
function check(fingerprint: string, zone = ZONE, center = 'nwac') {
  const url = `http://localhost/api/${center}/forecast-freshness/${zone}/${fingerprint}`
  return GET(new Request(url), { params: Promise.resolve({ center, zone, fingerprint }) })
}

async function answer(res: Response) {
  return {
    status: res.status,
    cacheControl: res.headers.get('Cache-Control'),
    body: await res.json(),
  }
}

/**
 * The common case: the shared cache holds `forecast` with no alert, and upstream agrees unless a
 * different fresh forecast/warning is passed.
 */
function upstreamAndCacheHold(fresh: unknown = forecast, freshWarning: unknown = null) {
  mockGetForecastFresh.mockResolvedValue(fresh)
  mockGetForecast.mockResolvedValue(forecast)
  mockGetWarningFresh.mockResolvedValue(freshWarning)
  mockGetWarning.mockResolvedValue(null)
}

/**
 * The cache holds a live alert but upstream came back with none — which the source cannot tell
 * apart from that zone's request having failed.
 */
function alertVanishedUpstream(fresh: unknown = forecast) {
  mockGetForecastFresh.mockResolvedValue(fresh)
  mockGetForecast.mockResolvedValue(forecast)
  mockGetWarningFresh.mockResolvedValue(null)
  mockGetWarning.mockResolvedValue(warning)
}

beforeEach(() => {
  mockRevalidateTag.mockClear()
  mockResolveZone.mockReset()
  mockGetForecastFresh.mockReset()
  mockGetForecast.mockReset()
  mockGetWarningFresh.mockReset()
  mockGetWarning.mockReset()
  mockResolveZone.mockResolvedValue({ slug: ZONE, zone: { id: 123, name: 'X' } })
})

describe('forecast-freshness route', () => {
  it('reports no change, cacheably, when the viewer already has the current forecast', async () => {
    upstreamAndCacheHold()

    const res = await answer(await check(etag))

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ changed: false })
    // The one answer that may be served from the edge: same fingerprint for every viewer inside
    // the ISR window, so it is one cache key per zone.
    expect(res.cacheControl).toBe(CACHEABLE)
    expect(mockRevalidateTag).not.toHaveBeenCalled()
  })

  it('revalidates the forecast tag and reports a change when fresh differs from the cached product', async () => {
    upstreamAndCacheHold({ ...forecast, bottom_line: 'CORRECTED' })

    const res = await answer(await check(etag))

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      changed: true,
      etag: forecastPageFingerprint({ ...forecast, bottom_line: 'CORRECTED' }, null),
    })
    // Never cached: it keeps random-fingerprint requests from polluting the edge, and guarantees
    // the purge below always reaches origin.
    expect(res.cacheControl).toBe('no-store')
    expect(mockRevalidateTag).toHaveBeenCalledWith('forecast:nwac:123')
  })

  it('also revalidates the weather tag when the changed forecast points to a weather product', async () => {
    upstreamAndCacheHold({
      ...forecast,
      bottom_line: 'CORRECTED',
      weather_data: { weather_product_id: 555 },
    })

    await check(etag)

    expect(mockRevalidateTag).toHaveBeenCalledWith('forecast:nwac:123')
    expect(mockRevalidateTag).toHaveBeenCalledWith('weather:555')
  })

  it('does NOT purge or blank on a failed/absent fresh fetch, and never caches that answer', async () => {
    // A transient upstream error surfaces as null — must not evict the last-known-good forecast,
    // and must not be cached as "you're current" for every viewer at that POP.
    mockGetForecastFresh.mockResolvedValue(null)

    const res = await answer(await check(etag))

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ changed: false, reason: 'indeterminate' })
    expect(res.cacheControl).toBe('no-store')
    expect(mockRevalidateTag).not.toHaveBeenCalled()
    expect(mockGetForecast).not.toHaveBeenCalled()
    expect(mockGetWarning).not.toHaveBeenCalled()
  })

  it('does NOT revalidate for a stale caller fingerprint when the cache is current (no purge abuse)', async () => {
    upstreamAndCacheHold()

    const res = await answer(await check(STALE_ETAG))

    // The purge decision is server-authoritative: fresh vs. cache, never the caller's fingerprint.
    expect(mockRevalidateTag).not.toHaveBeenCalled()
    // This caller is still told to refresh — they just can't make us purge.
    expect(res.body).toEqual({ changed: true, etag })
  })

  it('tells a viewer holding the absent-forecast fingerprint about a first publish', async () => {
    // The page renders a "no forecast" state with the fingerprint of `null`, so the very first
    // publish into a zone is a change an open tab can be told about.
    upstreamAndCacheHold()

    const res = await answer(await check(forecastPageFingerprint(null, null)))

    expect(res.body).toEqual({ changed: true, etag })
  })

  it('always runs the fresh check (no-skip invariant)', async () => {
    upstreamAndCacheHold()

    await check(etag)

    expect(mockGetForecastFresh).toHaveBeenCalled()
  })

  it('tells the viewer about an alert issued for the zone, though the forecast is untouched', async () => {
    // The reason the warning is in the address at all: nothing about the forecast moved, so a
    // forecast-only fingerprint answered "you're current" while the page was missing a live banner.
    upstreamAndCacheHold(forecast, warning)

    const res = await answer(await check(etag))

    expect(res.body).toEqual({ changed: true, etag: forecastPageFingerprint(forecast, warning) })
    expect(res.cacheControl).toBe('no-store')
  })

  it('purges the warning tag alone on a warning-only change (no upstream forecast re-fetch)', async () => {
    upstreamAndCacheHold(forecast, warning)

    await check(etag)

    expect(mockRevalidateTag).toHaveBeenCalledWith('warning:nwac:123')
    expect(mockRevalidateTag).not.toHaveBeenCalledWith('forecast:nwac:123')
  })

  it('does NOT blank a live alert that has gone missing upstream, and never caches that answer', async () => {
    // A vanished warning is a suspected blip: hold the cached alert and tell nobody.
    alertVanishedUpstream()

    const res = await answer(await check(forecastPageFingerprint(forecast, warning)))

    expect(res.body).toEqual({ changed: false, reason: 'indeterminate' })
    expect(res.cacheControl).toBe('no-store')
    expect(mockRevalidateTag).not.toHaveBeenCalled()
  })

  it('still reports a forecast change while an alert is unconfirmed', async () => {
    // Distrusting the vanished warning must not suppress a correction that really did land.
    const corrected = { ...forecast, bottom_line: 'CORRECTED' }
    alertVanishedUpstream(corrected)

    const res = await answer(await check(forecastPageFingerprint(forecast, warning)))

    // The cached alert is held in the address, so the viewer's refresh re-renders with it intact.
    expect(res.body).toEqual({ changed: true, etag: forecastPageFingerprint(corrected, warning) })
    expect(mockRevalidateTag).toHaveBeenCalledWith('forecast:nwac:123')
    expect(mockRevalidateTag).not.toHaveBeenCalledWith('warning:nwac:123')
  })

  it('propagates a genuine all-clear once the cached side agrees', async () => {
    upstreamAndCacheHold()

    const res = await answer(await check(forecastPageFingerprint(forecast, warning)))

    expect(res.body).toEqual({ changed: true, etag })
  })

  it('always runs the warning check too (no-skip invariant)', async () => {
    upstreamAndCacheHold()

    await check(etag)

    expect(mockGetWarningFresh).toHaveBeenCalled()
  })

  it('400s a malformed fingerprint without going upstream', async () => {
    const res = await check('not-a-fingerprint')

    expect(res.status).toBe(400)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(mockResolveZone).not.toHaveBeenCalled()
    expect(mockGetForecastFresh).not.toHaveBeenCalled()
  })

  it('400s a fingerprint of the right length that is not hex', async () => {
    const res = await check('Z'.repeat(40))

    expect(res.status).toBe(400)
    expect(mockGetForecastFresh).not.toHaveBeenCalled()
  })

  it('rejects an unknown center before it can reach upstream', async () => {
    // The center segment is interpolated into a NAC API URL, so it must not be caller-chosen.
    const res = await check(etag, ZONE, 'not-a-center')

    expect(res.status).toBe(404)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(mockResolveZone).not.toHaveBeenCalled()
    expect(mockGetForecastFresh).not.toHaveBeenCalled()
  })

  it('404s an unknown zone without caching the answer', async () => {
    mockResolveZone.mockResolvedValue(null)

    const res = await check(etag, 'not-a-zone')

    expect(res.status).toBe(404)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(mockGetForecastFresh).not.toHaveBeenCalled()
  })

  it('answers indeterminate, not 500, when the zone list itself is unreachable', async () => {
    // Resolving the slug is the one upstream call here that throws rather than returning null.
    // Uncaught it was an unhandled 500 — an answer with no cache policy of its own, on the route
    // whose whole design is that only one of its answers may be cached.
    mockResolveZone.mockRejectedValue(new Error('NAC API request failed with status 503'))

    const res = await answer(await check(etag))

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ changed: false, reason: 'indeterminate' })
    expect(res.cacheControl).toBe('no-store')
    expect(mockRevalidateTag).not.toHaveBeenCalled()
    expect(mockGetForecastFresh).not.toHaveBeenCalled()
  })
})
