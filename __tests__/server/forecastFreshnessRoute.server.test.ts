import { forecastFingerprint } from '@/services/nac/forecastFingerprint'
import { mapV2ForecastResult } from '@/services/nac/sources/v2/mappers'
import { forecastResultSchema } from '@/services/nac/types/forecastSchemas'
import { NextRequest } from 'next/server'
import nwacForecastActive from './fixtures/nwac-forecast-active.json'

const mockRevalidateTag = jest.fn()
jest.mock('next/cache', () => ({ revalidateTag: (tag: string) => mockRevalidateTag(tag) }))

const mockResolveZone = jest.fn()
jest.mock('../../src/services/nac/resolveZone', () => ({
  resolveZoneFromSlug: (...args: unknown[]) => mockResolveZone(...args),
}))

const mockGetForecastFresh = jest.fn()
const mockGetForecast = jest.fn()
jest.mock('../../src/services/nac/sources', () => ({
  getForecastSource: () => ({
    getForecastFresh: (...a: unknown[]) => mockGetForecastFresh(...a),
    getForecast: (...a: unknown[]) => mockGetForecast(...a),
  }),
}))

// Avoid loading the real nac module (and payload) just for the cache-tag helpers.
jest.mock('../../src/services/nac/nac', () => ({
  forecastCacheTag: (centerId: string, zoneId: number) =>
    `forecast:${centerId === 'dvac' ? 'nwac' : centerId}:${zoneId}`,
  weatherCacheTag: (id: number) => `weather:${id}`,
}))

// Import the handler after the mocks are registered (jest hoists the mocks above imports).
import { GET } from '@/app/api/[center]/forecast-freshness/route'

const forecast = mapV2ForecastResult(forecastResultSchema.parse(nwacForecastActive))
const etag = forecastFingerprint(forecast)
const params = Promise.resolve({ center: 'nwac' })

function req(headers: Record<string, string> = {}, zone: string | null = 'west-slopes-north') {
  const url = zone
    ? `http://localhost/api/nwac/forecast-freshness?zone=${zone}`
    : `http://localhost/api/nwac/forecast-freshness`
  return new NextRequest(url, { headers })
}

beforeEach(() => {
  mockRevalidateTag.mockClear()
  mockResolveZone.mockReset()
  mockGetForecastFresh.mockReset()
  mockGetForecast.mockReset()
  mockResolveZone.mockResolvedValue({ slug: 'west-slopes-north', zone: { id: 123, name: 'X' } })
})

describe('forecast-freshness route', () => {
  it('returns 304 without revalidating when the forecast is unchanged', async () => {
    mockGetForecastFresh.mockResolvedValue(forecast)
    mockGetForecast.mockResolvedValue(forecast)
    const res = await GET(req({ 'If-None-Match': etag }), { params })
    expect(res.status).toBe(304)
    expect(mockRevalidateTag).not.toHaveBeenCalled()
  })

  it('revalidates the forecast tag and returns 200 when fresh differs from the cached product', async () => {
    mockGetForecastFresh.mockResolvedValue({ ...forecast, bottom_line: 'CORRECTED' })
    mockGetForecast.mockResolvedValue(forecast)
    const res = await GET(req({ 'If-None-Match': etag }), { params })
    expect(res.status).toBe(200)
    expect(mockRevalidateTag).toHaveBeenCalledWith('forecast:nwac:123')
  })

  it('also revalidates the weather tag when the changed forecast points to a weather product', async () => {
    mockGetForecastFresh.mockResolvedValue({
      ...forecast,
      bottom_line: 'CORRECTED',
      weather_data: { weather_product_id: 555 },
    })
    mockGetForecast.mockResolvedValue(forecast)
    await GET(req({ 'If-None-Match': etag }), { params })
    expect(mockRevalidateTag).toHaveBeenCalledWith('forecast:nwac:123')
    expect(mockRevalidateTag).toHaveBeenCalledWith('weather:555')
  })

  it('does NOT purge or blank on a failed/absent fresh fetch (returns 304)', async () => {
    // A transient upstream error surfaces as null — must not evict the last-known-good forecast.
    mockGetForecastFresh.mockResolvedValue(null)
    const res = await GET(req({ 'If-None-Match': etag }), { params })
    expect(res.status).toBe(304)
    expect(mockRevalidateTag).not.toHaveBeenCalled()
    expect(mockGetForecast).not.toHaveBeenCalled()
  })

  it('does NOT revalidate for a bogus/absent client etag when the cache is current (no purge abuse)', async () => {
    mockGetForecastFresh.mockResolvedValue(forecast)
    mockGetForecast.mockResolvedValue(forecast)
    const res = await GET(req(), { params }) // no If-None-Match
    expect(mockRevalidateTag).not.toHaveBeenCalled()
    expect(res.status).toBe(200) // still tells this (fresh-less) client to refresh, but no purge
  })

  it('always runs the fresh check (no-skip invariant)', async () => {
    mockGetForecastFresh.mockResolvedValue(forecast)
    mockGetForecast.mockResolvedValue(forecast)
    await GET(req({ 'If-None-Match': etag }), { params })
    expect(mockGetForecastFresh).toHaveBeenCalled()
  })

  it('400s when the zone param is missing', async () => {
    const res = await GET(req({}, null), { params })
    expect(res.status).toBe(400)
    expect(mockGetForecastFresh).not.toHaveBeenCalled()
  })
})
