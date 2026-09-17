import { weatherPageFingerprint } from '@/services/nac/forecastFingerprint'
import { mapV2Weather } from '@/services/nac/sources/v2/mappers'
import { weatherSchema } from '@/services/nac/types/forecastSchemas'
import {
  CACHEABLE,
  STALE_ETAG,
  answer,
  expectIndeterminate,
} from '../helpers/freshnessRouteAnswers'
import sacWeather from './fixtures/sac-weather.json'

const mockRevalidateTag = jest.fn()
jest.mock('next/cache', () => ({ revalidateTag: (tag: string) => mockRevalidateTag(tag) }))

const mockReportIndeterminate = jest.fn()
jest.mock('../../src/utilities/freshnessTelemetry', () => ({
  reportIndeterminate: (...args: unknown[]) => mockReportIndeterminate(...args),
}))

const mockGetCurrentWeatherFresh = jest.fn()
const mockGetCurrentWeather = jest.fn()
jest.mock('../../src/services/nac/sources', () => ({
  getWeatherSource: () => ({
    getCurrentWeatherFresh: (...a: unknown[]) => mockGetCurrentWeatherFresh(...a),
    getCurrentWeather: (...a: unknown[]) => mockGetCurrentWeather(...a),
  }),
}))

// Avoid loading the real nac module (and payload) just for the zone list and cache-tag helpers.
const mockGetActiveForecastZones = jest.fn()
jest.mock('../../src/services/nac/nac', () => ({
  getActiveForecastZones: (...a: unknown[]) => mockGetActiveForecastZones(...a),
  currentWeatherCacheTag: (centerId: string, zoneId: number) =>
    `weather-current:${centerId}:${zoneId}`,
  weatherCacheTag: (id: number) => `weather:${id}`,
}))

// Import the handler after the mocks are registered (jest hoists the mocks above imports).
import { GET } from '@/app/api/[center]/weather-freshness/[fingerprint]/route'

const weather = mapV2Weather(weatherSchema.parse(sacWeather))
const corrected = { ...weather, weather_discussion: `${weather.weather_discussion} (corrected)` }
const reissued = { ...weather, id: weather.id + 1, updated_at: '2099-01-01T00:00:00+00:00' }
/** What a viewer rendered when the center had this weather product. */
const etag = weatherPageFingerprint(weather)
const ZONES = [{ slug: 'central-sierra-nevada', zone: { id: 1605, name: 'Central Sierra Nevada' } }]

/** Ask the endpoint on behalf of a viewer whose page rendered `fingerprint`. */
function check(fingerprint: string, center = 'sac') {
  const url = `http://localhost/api/${center}/weather-freshness/${fingerprint}`
  return GET(new Request(url), { params: Promise.resolve({ center, fingerprint }) })
}

/** The common case: the shared cache holds `weather`, and upstream agrees unless told otherwise. */
function upstreamAndCacheHold(fresh: unknown = weather) {
  mockGetCurrentWeatherFresh.mockResolvedValue(fresh)
  mockGetCurrentWeather.mockResolvedValue(weather)
}

beforeEach(() => {
  mockRevalidateTag.mockClear()
  mockReportIndeterminate.mockClear()
  mockGetActiveForecastZones.mockReset()
  mockGetCurrentWeatherFresh.mockReset()
  mockGetCurrentWeather.mockReset()
  mockGetActiveForecastZones.mockResolvedValue(ZONES)
})

describe('weather-freshness route', () => {
  it('reports no change, cacheably, when the viewer already has the current product', async () => {
    upstreamAndCacheHold()

    const res = await answer(await check(etag))

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ changed: false })
    expect(res.cacheControl).toBe(CACHEABLE)
    expect(mockRevalidateTag).not.toHaveBeenCalled()
  })

  it('asks upstream through the center’s first active zone, as the page does', async () => {
    upstreamAndCacheHold()

    await check(etag)

    expect(mockGetCurrentWeatherFresh).toHaveBeenCalledWith('sac', 1605)
    expect(mockGetCurrentWeather).toHaveBeenCalledWith('sac', 1605)
  })

  it('reports a change, uncacheably, and purges when the product was corrected', async () => {
    upstreamAndCacheHold(corrected)

    const res = await answer(await check(etag))

    expect(res.body).toEqual({ changed: true, etag: weatherPageFingerprint(corrected) })
    expect(res.cacheControl).toBe('no-store')
    expect(mockRevalidateTag).toHaveBeenCalledWith('weather-current:sac:1605')
    // The by-id tag too, so a forecast page's inline weather card sharing this product corrects.
    expect(mockRevalidateTag).toHaveBeenCalledWith(`weather:${weather.id}`)
  })

  it('reports and purges a first publish into a center whose cache held nothing', async () => {
    mockGetCurrentWeatherFresh.mockResolvedValue(weather)
    mockGetCurrentWeather.mockResolvedValue(null)

    const res = await answer(await check(weatherPageFingerprint(null)))

    expect(res.body).toEqual({ changed: true, etag })
    expect(mockRevalidateTag).toHaveBeenCalledWith('weather-current:sac:1605')
    expect(mockRevalidateTag).toHaveBeenCalledWith(`weather:${weather.id}`)
    expect(mockRevalidateTag).toHaveBeenCalledTimes(2)
  })

  it('purges the old product’s by-id tag as well when a new product replaces it', async () => {
    upstreamAndCacheHold(reissued)

    await check(etag)

    expect(mockRevalidateTag).toHaveBeenCalledWith(`weather:${weather.id}`)
    expect(mockRevalidateTag).toHaveBeenCalledWith(`weather:${reissued.id}`)
  })

  it('refreshes a stale viewer without purging when the shared cache is already current', async () => {
    // The cache regenerated for someone else; this viewer just has an older render. A purge here
    // would be caller-driven, which is exactly what content addressing must not allow.
    upstreamAndCacheHold()

    const res = await answer(await check(STALE_ETAG))

    expect(res.body).toEqual({ changed: true, etag })
    expect(mockRevalidateTag).not.toHaveBeenCalled()
  })

  it('is indeterminate, and reports it, when no fresh product can be established', async () => {
    mockGetCurrentWeatherFresh.mockResolvedValue(null)
    mockGetCurrentWeather.mockResolvedValue(weather)

    expectIndeterminate(await answer(await check(etag)), mockRevalidateTag)
    expect(mockReportIndeterminate).toHaveBeenCalledWith('no-fresh-weather', 'sac')
  })

  it('does not report a page that also had nothing asking about the absent-product address', async () => {
    mockGetCurrentWeatherFresh.mockResolvedValue(null)
    mockGetCurrentWeather.mockResolvedValue(null)

    expectIndeterminate(await answer(await check(weatherPageFingerprint(null))), mockRevalidateTag)
    expect(mockReportIndeterminate).not.toHaveBeenCalled()
  })

  it('is indeterminate, not a 500, when the zone list is unreachable', async () => {
    mockGetActiveForecastZones.mockRejectedValue(new Error('upstream down'))

    expectIndeterminate(await answer(await check(etag)), mockRevalidateTag)
    expect(mockReportIndeterminate).toHaveBeenCalledWith('zones-unreachable', 'sac')
    expect(mockGetCurrentWeatherFresh).not.toHaveBeenCalled()
  })

  it('404s a center with no active zones', async () => {
    mockGetActiveForecastZones.mockResolvedValue([])

    const res = await answer(await check(etag))

    expect(res.status).toBe(404)
    expect(res.cacheControl).toBe('no-store')
  })

  it('rejects a malformed fingerprint before going upstream', async () => {
    const res = await answer(await check('not-a-fingerprint'))

    expect(res.status).toBe(400)
    expect(mockGetActiveForecastZones).not.toHaveBeenCalled()
  })

  it('refuses an unknown center before going upstream', async () => {
    const res = await answer(await check(etag, 'not-a-center'))

    expect(res.status).toBe(404)
    expect(mockGetActiveForecastZones).not.toHaveBeenCalled()
  })
})
